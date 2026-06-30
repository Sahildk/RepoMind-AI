import os
import re
import base64
import json
from typing import Optional, List
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl
import httpx
import google.generativeai as genai
from dotenv import load_dotenv

# Load env variables from .env if present
load_dotenv()

app = FastAPI(title="The 7-Hour Architecture API")

# Configure CORS so Next.js frontend can call this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For local hackathon development, allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Noise filtering constants
NOISE_DIRS = {
    '.git', 'node_modules', 'venv', '.venv', 'env', '.next', 'build', 'dist', 
    'out', '.cache', '__pycache__', '.idea', '.vscode', 'target', 'bin', 'obj', 
    '.expo', '.nuxt', 'bower_components'
}

NOISE_EXTENSIONS = {
    '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.svg',
    '.mp4', '.mp3', '.wav', '.mov', '.avi',
    '.zip', '.tar', '.gz', '.7z', '.rar',
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
    '.woff', '.woff2', '.ttf', '.eot',
    '.exe', '.dll', '.so', '.dylib', '.class', '.jar',
    '.map'
}

NOISE_FILES = {
    'yarn.lock', 'package-lock.json', 'pnpm-lock.yaml', 'poetry.lock', 'Cargo.lock',
    '.DS_Store', 'LICENSE', 'LICENCE', '.gitignore', '.eslintignore', '.prettierignore'
}

DEPENDENCY_MANIFESTS = {
    'package.json',
    'requirements.txt',
    'pyproject.toml',
    'setup.py',
    'Cargo.toml',
    'go.mod',
    'Gemfile',
    'composer.json',
    'build.gradle',
    'pom.xml',
    'CMakeLists.txt',
    'mix.exs'
}

class AnalyzeRequest(BaseModel):
    repo_url: str
    branch: Optional[str] = None
    github_token: Optional[str] = None
    gemini_api_key: Optional[str] = None

class AnalyzeResponse(BaseModel):
    owner: str
    repo: str
    branch: str
    summary: List[str]
    mermaid: str
    stats: dict

def parse_github_url(url: str) -> tuple[str, str]:
    """Parses owner and repository name from various GitHub URL formats."""
    # Clean up whitespace
    url = url.strip()
    # Strip protocol if present
    url = re.sub(r'^(https?://)?(www\.)?github\.com/', '', url)
    # Strip trailing slash or .git
    url = re.sub(r'\.git$', '', url)
    url = url.strip('/')
    
    parts = url.split('/')
    if len(parts) < 2:
        raise HTTPException(
            status_code=400, 
            detail="Invalid GitHub repository URL. Must be in the format 'owner/repo' or 'https://github.com/owner/repo'"
        )
    return parts[0], parts[1]

def is_noise(path: str) -> bool:
    """Returns True if the path contains directories or file types we want to ignore."""
    parts = path.split('/')
    # Check if any parent folder is in NOISE_DIRS
    for part in parts[:-1]:
        if part in NOISE_DIRS:
            return True
            
    # Check the filename
    filename = parts[-1]
    if filename in NOISE_FILES:
        return True
        
    # Check extension
    _, ext = os.path.splitext(filename)
    if ext.lower() in NOISE_EXTENSIONS:
        return True
        
    return False

def build_tree_string(paths: List[str]) -> str:
    """Constructs an indented tree representation from a flat list of paths."""
    tree = {}
    for path in sorted(paths):
        parts = path.split('/')
        current = tree
        for part in parts:
            if part not in current:
                current[part] = {}
            current = current[part]
            
    def render(node, indent=0):
        lines = []
        for name, child in sorted(node.items()):
            if child:  # is a directory
                lines.append(f"{'  ' * indent}- {name}/")
                lines.extend(render(child, indent + 1))
            else:  # is a file
                lines.append(f"{'  ' * indent}- {name}")
        return lines
        
    return "\n".join(render(tree))

@app.get("/health")
def health_check():
    return {"status": "ok", "message": "The 7-Hour Architecture API is running"}

@app.post("/api/analyze", response_model=AnalyzeResponse)
async def analyze_repo(request: AnalyzeRequest):
    owner, repo = parse_github_url(request.repo_url)
    
    # 1. Resolve token & api key
    github_token = request.github_token or os.getenv("GITHUB_TOKEN")
    gemini_api_key = request.gemini_api_key or os.getenv("GEMINI_API_KEY")
    
    if not gemini_api_key:
        raise HTTPException(
            status_code=400,
            detail="Gemini API Key is missing. Please set it in the backend .env or provide it in the input panel."
        )
        
    # Set headers for GitHub API requests
    headers = {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "RepoMind-Architecture-Mapper"
    }
    
    # Ignore placeholder token values
    if github_token and github_token.strip() and "your_github_token" not in github_token.lower():
        headers["Authorization"] = f"token {github_token.strip()}"
        
    async with httpx.AsyncClient() as client:
        # 2. Get default branch if not specified
        resolved_branch = request.branch
        if not resolved_branch:
            repo_api_url = f"https://api.github.com/repos/{owner}/{repo}"
            try:
                repo_resp = await client.get(repo_api_url, headers=headers)
                if repo_resp.status_code == 404:
                    raise HTTPException(status_code=404, detail=f"Repository '{owner}/{repo}' not found. Make sure it is public.")
                elif repo_resp.status_code == 403 and "rate limit exceeded" in repo_resp.text.lower():
                    raise HTTPException(status_code=403, detail="GitHub API rate limit exceeded. Please provide a GitHub Token to continue.")
                repo_resp.raise_for_status()
                resolved_branch = repo_resp.json().get("default_branch", "main")
            except httpx.HTTPStatusError as e:
                raise HTTPException(status_code=e.response.status_code, detail=f"GitHub API Error: {e.response.text}")
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Failed to fetch repository details: {str(e)}")

        # 3. Fetch Git tree recursively
        tree_api_url = f"https://api.github.com/repos/{owner}/{repo}/git/trees/{resolved_branch}?recursive=1"
        try:
            tree_resp = await client.get(tree_api_url, headers=headers)
            if tree_resp.status_code == 404:
                raise HTTPException(status_code=404, detail=f"Branch '{resolved_branch}' not found for repository '{owner}/{repo}'.")
            elif tree_resp.status_code == 403 and "rate limit exceeded" in tree_resp.text.lower():
                raise HTTPException(status_code=403, detail="GitHub API rate limit exceeded. Please provide a GitHub Token to continue.")
            tree_resp.raise_for_status()
            tree_data = tree_resp.json()
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=e.response.status_code, detail=f"GitHub API Error fetching tree: {e.response.text}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to fetch repository tree: {str(e)}")
            
        raw_tree_entries = tree_data.get("tree", [])
        
        # 4. Filter tree entries
        filtered_paths = []
        detected_dependency_files = []
        total_files = 0
        filtered_files_count = 0
        
        for entry in raw_tree_entries:
            path = entry.get("path", "")
            entry_type = entry.get("type", "")
            
            if entry_type == "blob":
                total_files += 1
                if is_noise(path):
                    filtered_files_count += 1
                    continue
                filtered_paths.append(path)
                
                # Check if it is a key dependency manifest
                filename = path.split('/')[-1]
                if filename in DEPENDENCY_MANIFESTS:
                    detected_dependency_files.append(path)
            elif entry_type == "tree":
                # Keep directory structures if not noise
                parts = path.split('/')
                if not any(part in NOISE_DIRS for part in parts):
                    filtered_paths.append(path + "/")

        # Limit tree size sent to LLM to prevent bloating (though Gemini has 1M context, keep it efficient)
        # Sort and select top dependency files to fetch contents for
        # We prefer files at the root level first
        detected_dependency_files.sort(key=lambda p: (p.count('/'), p))
        target_dependency_files = detected_dependency_files[:4] # fetch top 4 manifests
        
        dependency_contents = {}
        for dep_path in target_dependency_files:
            content_api_url = f"https://api.github.com/repos/{owner}/{repo}/contents/{dep_path}?ref={resolved_branch}"
            try:
                content_resp = await client.get(content_api_url, headers=headers)
                if content_resp.status_code == 200:
                    data = content_resp.json()
                    raw_content = data.get("content", "")
                    encoding = data.get("encoding", "")
                    if encoding == "base64":
                        decoded_bytes = base64.b64decode(raw_content)
                        # Decode with utf-8, ignore errors for binary edge cases
                        decoded_text = decoded_bytes.decode("utf-8", errors="ignore")
                        # Truncate large dependency files to avoid bloating prompt
                        if len(decoded_text) > 4000:
                            decoded_text = decoded_text[:4000] + "\n... [TRUNCATED] ..."
                        dependency_contents[dep_path] = decoded_text
            except Exception as e:
                # Log and continue if single dependency fetch fails
                print(f"Error fetching content for {dep_path}: {e}")
                continue

    # 5. Format inputs for LLM
    tree_text = build_tree_string(filtered_paths)
    
    deps_text_list = []
    for path, content in dependency_contents.items():
        deps_text_list.append(f"--- File: {path} ---\n{content}\n")
    deps_text = "\n".join(deps_text_list)
    
    # 6. LLM Generation
    try:
        genai.configure(api_key=gemini_api_key)
        model = genai.GenerativeModel("gemini-2.5-flash")
        
        prompt = f"""You are an elite software architect. Analyze the repository file structure and dependency files below.
Generate a structured JSON response detailing the system architecture.

Your response must be a JSON object with exactly two keys:
1. "summary": An array of exactly 3 highly descriptive, concise bullet points summarizing:
   - The primary technology stack and framework used.
   - The architectural design pattern (e.g. MVC, Clean Architecture, Serverless, Monolith) and layout structure.
   - The main entry points, data flow, and how components interact.
2. "mermaid": A valid Mermaid.js flowchart string (using "flowchart TD" or "flowchart LR") representing:
   - The primary system components, major folders, and services.
   - Keep node identifiers simple and alphanumeric (e.g. `A`, `B`, `App`, `DB`, `Src`).
   - If a node label contains ANY special characters (like dots in "package.json", slashes in "src/app", or dashes in "main-app"), you MUST wrap the label in double quotes inside the shape syntax. Examples:
     - `A["package.json"]` (Correct)
     - `A(package.json)` (Incorrect - will cause a parsing crash because of the dot)
     - `B["src/components"]` (Correct)
     - `B(src/components)` (Incorrect - will cause a parsing crash because of the slash)
     - `C["main-app"]` (Correct)
   - Ensure every link is fully closed and has both a source and a target node. Example: `A -->|Label| B`. Never leave a link hanging (e.g. `A -->|Label|`).
   - DO NOT use HTML tags, brackets, parentheses, or odd punctuation inside labels unless the label is fully wrapped in double quotes.
   - Do NOT wrap the mermaid string in ```mermaid code blocks. It should be a raw string.

Your output must be VALID JSON and ONLY the JSON object. Do not include markdown code fence formatting (like ```json ... ```).

--- REPOSITORY PATH TREE ---
{tree_text}

--- DEPENDENCY FILES ---
{deps_text}
"""
        
        # Configure model to enforce JSON output
        generation_config = {
            "response_mime_type": "application/json",
            "temperature": 0.2
        }
        
        response = model.generate_content(prompt, generation_config=generation_config)
        llm_output = response.text.strip()
        
        # Parse JSON
        result = json.loads(llm_output)
        
        summary = result.get("summary", [
            "Analyzed repository structure and dependencies.",
            "Visualized main components using Mermaid flowchart.",
            "Identified key patterns and entry points."
        ])
        mermaid_string = result.get("mermaid", "flowchart TD\n  Start[Repository] --> End[Analysis]")
        
        # Make sure summary has exactly 3 elements
        if len(summary) < 3:
            summary = summary + ["No additional architecture details found."] * (3 - len(summary))
        summary = summary[:3]
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate architectural analysis using Gemini: {str(e)}"
        )
        
    stats = {
        "total_files": total_files,
        "filtered_noise_files": filtered_files_count,
        "analyzed_files": len(filtered_paths),
        "detected_manifests": len(detected_dependency_files),
        "fetched_manifests": list(dependency_contents.keys())
    }
    
    return AnalyzeResponse(
        owner=owner,
        repo=repo,
        branch=resolved_branch,
        summary=summary,
        mermaid=mermaid_string,
        stats=stats
    )
if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8000))
    is_prod = os.environ.get("ENVIRONMENT", "development") == "production"
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=not is_prod)
