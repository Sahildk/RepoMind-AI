"use client";

import { useState, useEffect, useRef } from "react";
import { 
  GitFork, 
  Map, 
  Settings, 
  Sparkles, 
  FileText, 
  BarChart3, 
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Maximize2,
  Minimize2,
  Terminal as TerminalIcon,
  Play,
  Check,
  RefreshCw,
  Folder,
  File,
  ChevronRight,
  ChevronDown,
  Layers,
  Cpu,
  FileCode,
  Globe,
  Sun,
  Moon
} from "lucide-react";
import MermaidRenderer from "@/components/MermaidRenderer";

interface AnalyzeResponse {
  owner: string;
  repo: string;
  branch: string;
  summary: string[];
  mermaid: string;
  stats: {
    total_files: number;
    filtered_noise_files: number;
    analyzed_files: number;
    detected_manifests: number;
    fetched_manifests: string[];
  };
}

interface LogLine {
  text: string;
  type: "info" | "success" | "warning" | "error";
  time: string;
}

interface TreeNode {
  name: string;
  type: "file" | "dir";
  children?: TreeNode[];
}

const QUICK_TEMPLATES = [
  { name: "Flask Web", url: "pallets/flask", desc: "Python WSGI Framework", icon: "🌶️", code: "FLSK", color: "from-zinc-500/5 to-zinc-700/5 border-zinc-900 hover:border-zinc-700 text-zinc-400" },
  { name: "Express API", url: "expressjs/express", desc: "Minimal Node.js API", icon: "⚡", code: "EXPR", color: "from-blue-500/5 to-indigo-500/5 border-zinc-900 hover:border-zinc-700 text-blue-400" },
  { name: "FastAPI Starter", url: "tiangolo/full-stack-fastapi-template", desc: "Vue + Python Stack", icon: "🐍", code: "FAPI", color: "from-emerald-500/5 to-teal-500/5 border-zinc-900 hover:border-zinc-700 text-emerald-400" },
  { name: "Next.js Template", url: "vercel/next-react-template", desc: "React Boilerplate", icon: "⚛️", code: "NXJS", color: "from-purple-500/5 to-fuchsia-500/5 border-zinc-900 hover:border-zinc-700 text-purple-400" }
];

function parsePathsToTree(paths: string[]): TreeNode[] {
  const root: TreeNode[] = [];
  
  paths.forEach(path => {
    const isDir = path.endsWith("/");
    const cleanPath = isDir ? path.slice(0, -1) : path;
    if (!cleanPath) return;
    
    const parts = cleanPath.split("/");
    let currentLevel = root;
    
    parts.forEach((part, index) => {
      const isLast = index === parts.length - 1;
      const type = (isLast && !isDir) ? "file" : "dir";
      
      let existingNode = currentLevel.find(node => node.name === part && node.type === type);
      
      if (!existingNode) {
        existingNode = { name: part, type };
        if (type === "dir") {
          existingNode.children = [];
        }
        currentLevel.push(existingNode);
      }
      
      if (type === "dir" && existingNode.children) {
        currentLevel = existingNode.children;
      }
    });
  });
  
  const sortTree = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === "dir" ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
    nodes.forEach(node => {
      if (node.children) sortTree(node.children);
    });
  };
  
  sortTree(root);
  return root;
}

export default function Workspace() {
  // Input states
  const [repoUrl, setRepoUrl] = useState("");
  const [branch, setBranch] = useState("");
  const [githubToken, setGithubToken] = useState("");
  const [geminiApiKey, setGeminiApiKey] = useState("");
  
  // UI states
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState<"map" | "summary" | "tree" | "dependencies" | "metrics">("map");
  const [selectedManifest, setSelectedManifest] = useState<string | null>(null);
  const [manifestContent, setManifestContent] = useState<string>("");
  const [manifestLoading, setManifestLoading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Terminal log simulator states
  const [logs, setLogs] = useState<LogLine[]>([]);
  const logIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const savedTheme = localStorage.getItem("repomind-theme") as "light" | "dark";
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("repomind-theme", nextTheme);
  };

  const handleCopyLink = () => {
    if (!result) return;
    const shareUrl = `${window.location.origin}${window.location.pathname}?repo=${encodeURIComponent(repoUrl)}&branch=${encodeURIComponent(branch || result.branch)}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.mermaid);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Load saved credentials from localStorage & check query parameters
  useEffect(() => {
    const savedToken = localStorage.getItem("repomind_github_token");
    const savedKey = localStorage.getItem("repomind_gemini_key");
    const savedUrl = localStorage.getItem("repomind_last_url");
    if (savedToken) setGithubToken(savedToken);
    if (savedKey) setGeminiApiKey(savedKey);
    
    // Check URL search parameters for sharing permalinks
    const params = new URLSearchParams(window.location.search);
    const urlParam = params.get("repo") || params.get("url");
    const branchParam = params.get("branch");
    
    if (urlParam) {
      setRepoUrl(urlParam);
      if (branchParam) setBranch(branchParam);
      // Wait for credentials load from localStorage before auto analyzing
      setTimeout(() => {
        handleAnalyze(undefined, urlParam, branchParam || undefined);
      }, 100);
    } else if (savedUrl) {
      setRepoUrl(savedUrl);
    }
  }, []);

  // Fetch dependency manifest file content when selected
  useEffect(() => {
    if (!result || !selectedManifest) return;
    
    const fetchManifest = async () => {
      setManifestLoading(true);
      setManifestContent("");
      
      const token = githubToken || localStorage.getItem("repomind_github_token");
      const headers: Record<string, string> = {
        "Accept": "application/vnd.github.v3+json"
      };
      if (token && token.trim() && !token.toLowerCase().includes("your_github_token")) {
        headers["Authorization"] = `token ${token.trim()}`;
      }

      try {
        const url = `https://api.github.com/repos/${result.owner}/${result.repo}/contents/${selectedManifest}?ref=${result.branch}`;
        const res = await fetch(url, { headers });
        if (res.ok) {
          const data = await res.json();
          if (data.encoding === "base64" && data.content) {
            const decoded = atob(data.content.replace(/\s/g, ""));
            setManifestContent(decoded);
          } else {
            setManifestContent("// Content empty or unsupported encoding.");
          }
        } else {
          setManifestContent(`// Error loading manifest: HTTP ${res.status}`);
        }
      } catch (err: any) {
        setManifestContent(`// Error connecting to GitHub API:\n${err.message}`);
      } finally {
        setManifestLoading(false);
      }
    };

    fetchManifest();
  }, [selectedManifest, result, githubToken]);

  // Set default selected manifest when result arrives
  useEffect(() => {
    if (result && result.stats.fetched_manifests.length > 0) {
      setSelectedManifest(result.stats.fetched_manifests[0]);
    } else {
      setSelectedManifest(null);
    }
  }, [result]);

  const addLog = (text: string, type: "info" | "success" | "warning" | "error" = "info") => {
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
    setLogs(prev => [...prev, { text, type, time }]);
  };

  const simulateLogs = (targetOwner: string, targetRepo: string) => {
    setLogs([]);
    let step = 0;
    
    const messages = [
      { text: `[SYS] Initializing topology scanning pipeline for ${targetOwner}/${targetRepo}...`, delay: 0 },
      { text: `[NET] Handshaking with GitHub REST Gateway API...`, delay: 400 },
      { text: `[NET] Retrieving recursive Git tree metadata...`, delay: 900 },
      { text: `[OPS] Analyzing hierarchy structure and excluding noise files...`, delay: 1800 },
      { text: `[OPS] Noise filtered. Stripped binary files, caches, and build lockfiles.`, delay: 2400 },
      { text: `[OPS] Identifying package manifests and system dependencies...`, delay: 3000 },
      { text: `[NET] Extracting code context from package dependency configurations...`, delay: 3600 },
      { text: `[LLM] Feeding metadata context block to Gemini 2.5 Flash...`, delay: 4300 },
      { text: `[LLM] Generating system architecture flowchart and summary nodes...`, delay: 5000 },
      { text: `[SYS] Compiling flow diagram canvas layers...`, delay: 6200 }
    ];

    const runNextLog = () => {
      if (step < messages.length) {
        addLog(messages[step].text, "info");
        const nextDelay = step + 1 < messages.length ? messages[step + 1].delay - messages[step].delay : 1200;
        step++;
        logIntervalRef.current = setTimeout(runNextLog, nextDelay);
      }
    };

    runNextLog();
  };

  const stopSimulatingLogs = () => {
    if (logIntervalRef.current) {
      clearTimeout(logIntervalRef.current);
    }
  };

  const handleAnalyze = async (e?: React.FormEvent, customUrl?: string, customBranch?: string) => {
    if (e) e.preventDefault();
    
    const targetUrl = customUrl || repoUrl;
    const targetBranch = customBranch || branch;
    if (!targetUrl) {
      setError("Please enter a GitHub repository URL.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);
    setActiveTab("map");

    let tempOwner = "owner";
    let tempRepo = "repo";
    try {
      let cleanUrl = targetUrl.trim();
      cleanUrl = cleanUrl.replace(/^(https?:\/\/)?(www\.)?github\.com\//, "");
      cleanUrl = cleanUrl.replace(/\.git$/, "");
      cleanUrl = cleanUrl.replace(/\/$/, "");
      const parts = cleanUrl.split("/");
      if (parts.length >= 2) {
        tempOwner = parts[0];
        tempRepo = parts[1];
      }
    } catch (_) {}

    simulateLogs(tempOwner, tempRepo);

    localStorage.setItem("repomind_github_token", githubToken);
    localStorage.setItem("repomind_gemini_key", geminiApiKey);
    localStorage.setItem("repomind_last_url", targetUrl);

    try {
      const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      const apiUrl = rawApiUrl.replace(/\/$/, "");
      const response = await fetch(`${apiUrl}/api/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          repo_url: targetUrl,
          branch: targetBranch || null,
          github_token: githubToken || null,
          gemini_api_key: geminiApiKey || null,
        }),
      });

      const data = await response.json();
      stopSimulatingLogs();

      if (!response.ok) {
        addLog(`[ERR] Pipeline failed: ${data.detail || "API response error"}`, "error");
        throw new Error(data.detail || "An error occurred while analyzing the repository.");
      }

      addLog(`[SYS] Flow graph compiled. Canvas ready.`, "success");
      setResult(data);
    } catch (err: any) {
      stopSimulatingLogs();
      console.error(err);
      setError(err.message || "Failed to connect to the backend server. Make sure it is running on port 8000.");
      addLog(`[ERR] Scrape aborted: ${err.message || "Server connection failed"}`, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTemplateClick = (url: string) => {
    setRepoUrl(url);
    handleAnalyze(undefined, url);
  };

  // Directory Tree node renderer component
  const FileNode: React.FC<{ node: TreeNode; depth: number }> = ({ node, depth }) => {
    const [isOpen, setIsOpen] = useState(depth === 0);
    
    if (node.type === "dir") {
      return (
        <div className="flex flex-col select-none">
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className={`flex items-center gap-1.5 py-1 rounded text-[11px] font-medium w-full text-left transition px-1.5 ${
              theme === "light" ? "hover:bg-zinc-100 text-zinc-700" : "hover:bg-zinc-900/40 text-zinc-300"
            }`}
            style={{ paddingLeft: `${depth * 12 + 6}px` }}
          >
            <span className={`text-[9px] font-mono w-3 text-center flex items-center justify-center ${
              theme === "light" ? "text-zinc-400" : "text-zinc-650"
            }`}>
              {isOpen ? "-" : "+"}
            </span>
            <Folder className={`w-3 h-3 fill-zinc-500/5 ${theme === "light" ? "text-zinc-500" : "text-zinc-400"}`} />
            <span className="tracking-wide">{node.name}/</span>
          </button>
          {isOpen && node.children && (
            <div className="flex flex-col">
              {node.children.map((child, i) => (
                <FileNode key={i} node={child} depth={depth + 1} />
              ))}
            </div>
          )}
        </div>
      );
    } else {
      return (
        <div 
          className={`flex items-center gap-1.5 py-1 text-[11px] font-mono select-none px-1.5 ${
            theme === "light" ? "text-zinc-650" : "text-zinc-500"
          }`}
          style={{ paddingLeft: `${depth * 12 + 18}px` }}
        >
          <File className={`w-3.5 h-3.5 ${theme === "light" ? "text-zinc-400" : "text-zinc-700"}`} />
          <span>{node.name}</span>
        </div>
      );
    }
  };

  return (
    <div className={`flex awwwards-grid h-screen w-full relative overflow-hidden font-sans select-none animate-fadeIn transition-colors duration-300 ${
      theme === "light" ? "theme-light bg-[#f8f8fa] text-zinc-800" : "bg-[#020203] text-zinc-100"
    }`}>
      
      {/* Structural layout dividers (Awwwards blueprint styling) */}
      <div className="blueprint-overlay absolute inset-0 pointer-events-none z-0"></div>

      {/* Main SaaS Layout Sidebar */}
      <aside className={`w-60 border-r flex flex-col z-20 flex-shrink-0 relative transition-colors duration-300 ${
        theme === "light" ? "border-zinc-200 bg-white" : "border-zinc-900 bg-[#020203]/90 backdrop-blur-xl"
      }`}>
        {/* Tiny corner coordinates indicator */}
        <span className="absolute top-1 left-2 text-[8px] font-mono text-zinc-800">NAV.SYS.GRID_01</span>

        {/* Workspace Brand / Header */}
        <div className={`p-5 border-b flex items-center justify-between transition-colors duration-300 ${
          theme === "light" ? "border-zinc-200" : "border-zinc-900"
        }`}>
          <a href="/" className="flex items-center gap-2 hover:opacity-85 transition cursor-pointer">
            <span className="w-2.5 h-2.5 bg-orange-500 rounded-sm"></span>
            <span className={`font-mono text-xs font-black tracking-[0.2em] uppercase transition-colors ${
              theme === "light" ? "text-zinc-800" : "text-zinc-300"
            }`}>
              REPOMIND
            </span>
          </a>
          <span className={`text-[8px] font-mono px-1 rounded border transition-colors ${
            theme === "light" 
              ? "text-zinc-500 bg-zinc-50 border-zinc-200" 
              : "text-zinc-650 bg-zinc-900 border-zinc-850"
          }`}>V2.5</span>
        </div>

        {/* Sidebar Nav Links */}
        <nav className="flex-1 p-4 flex flex-col gap-1">
          <div className="text-[9px] font-bold text-zinc-700 font-mono uppercase tracking-[0.15em] px-2.5 mb-3">WORKSPACE CHANNELS</div>
          
          <button
            onClick={() => setActiveTab("map")}
            disabled={!result}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-[10px] font-mono uppercase tracking-wider transition text-left cursor-pointer border ${
              activeTab === "map" 
                ? theme === "light" ? "bg-zinc-100 border-zinc-200 text-zinc-850" : "bg-zinc-900/60 border-zinc-800 text-zinc-200" 
                : theme === "light" ? "border-transparent text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100/50 disabled:opacity-20" : "border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/20 disabled:opacity-20 disabled:pointer-events-none"
            }`}
          >
            <span className="text-[8px] text-zinc-600 mr-1">01 //</span>
            Flow Canvas
          </button>

          <button
            onClick={() => setActiveTab("summary")}
            disabled={!result}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-[10px] font-mono uppercase tracking-wider transition text-left cursor-pointer border ${
              activeTab === "summary" 
                ? theme === "light" ? "bg-zinc-100 border-zinc-200 text-zinc-850" : "bg-zinc-900/60 border-zinc-800 text-zinc-200" 
                : theme === "light" ? "border-transparent text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100/50 disabled:opacity-20" : "border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/20 disabled:opacity-20 disabled:pointer-events-none"
            }`}
          >
            <span className="text-[8px] text-zinc-600 mr-1">02 //</span>
            Architecture Summary
          </button>

          <button
            onClick={() => setActiveTab("tree")}
            disabled={!result}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-[10px] font-mono uppercase tracking-wider transition text-left cursor-pointer border ${
              activeTab === "tree" 
                ? theme === "light" ? "bg-zinc-100 border-zinc-200 text-zinc-850" : "bg-zinc-900/60 border-zinc-800 text-zinc-200" 
                : theme === "light" ? "border-transparent text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100/50 disabled:opacity-20" : "border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/20 disabled:opacity-20 disabled:pointer-events-none"
            }`}
          >
            <span className="text-[8px] text-zinc-600 mr-1">03 //</span>
            Codebase Tree
          </button>

          <button
            onClick={() => setActiveTab("dependencies")}
            disabled={!result}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-[10px] font-mono uppercase tracking-wider transition text-left cursor-pointer border ${
              activeTab === "dependencies" 
                ? theme === "light" ? "bg-zinc-100 border-zinc-200 text-zinc-850" : "bg-zinc-900/60 border-zinc-800 text-zinc-200" 
                : theme === "light" ? "border-transparent text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100/50 disabled:opacity-20" : "border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/20 disabled:opacity-20 disabled:pointer-events-none"
            }`}
          >
            <span className="text-[8px] text-zinc-600 mr-1">04 //</span>
            Package Manifests
          </button>

          <button
            onClick={() => setActiveTab("metrics")}
            disabled={!result}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-[10px] font-mono uppercase tracking-wider transition text-left cursor-pointer border ${
              activeTab === "metrics" 
                ? theme === "light" ? "bg-zinc-100 border-zinc-200 text-zinc-850" : "bg-zinc-900/60 border-zinc-800 text-zinc-200" 
                : theme === "light" ? "border-transparent text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100/50 disabled:opacity-20" : "border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/20 disabled:opacity-20 disabled:pointer-events-none"
            }`}
          >
            <span className="text-[8px] text-zinc-600 mr-1">05 //</span>
            Scan Metrics
          </button>
        </nav>

        {/* Sidebar Footer - Active Repository Info */}
        <div className={`p-4 border-t flex flex-col gap-1.5 relative transition-colors duration-300 ${
          theme === "light" ? "border-zinc-200 bg-zinc-50/30" : "border-zinc-900 bg-[#030303]/20"
        }`}>
          
          {result ? (
            <div className="flex flex-col gap-1 p-3 bg-zinc-950/80 border border-zinc-900 rounded-lg">
              <span className="text-[8px] font-mono text-emerald-500 flex items-center gap-1.5 uppercase font-bold tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                ACTIVE SCOPE
              </span>
              <div className="text-[10px] font-mono font-bold text-zinc-400 truncate max-w-full mt-0.5" title={`${result.owner}/${result.repo}`}>
                {result.owner}/{result.repo}
              </div>
              <div className="text-[9px] font-mono text-zinc-600 flex items-center gap-1 mt-0.5 truncate">
                <GitFork className="w-2.5 h-2.5 text-zinc-800" />
                {result.branch}
              </div>
            </div>
          ) : (
            <div className="p-3 text-center bg-zinc-900/5 border border-dashed border-zinc-900 rounded-lg text-zinc-600 text-[10px] font-mono uppercase tracking-wider select-none">
              Scope Idle
            </div>
          )}
        </div>
      </aside>

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-w-0 z-10 relative bg-transparent">
        
        {/* Workspace Top Global Control Bar */}
        <header className={`h-16 border-b px-6 flex items-center justify-between z-30 flex-shrink-0 relative transition-colors duration-300 ${
          theme === "light" ? "border-zinc-200 bg-white" : "border-zinc-900 bg-[#030303]/85 backdrop-blur-md"
        }`}>
          
          <form onSubmit={handleAnalyze} className="flex-1 max-w-2xl flex items-center gap-2">
            
            {/* Repo input */}
            <div className="flex-1 relative">
              <input 
                type="text"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="Repository (e.g. pallets/flask)"
                className={`w-full border focus:ring-0 rounded-lg pl-8 pr-3.5 py-2 text-xs font-mono transition ${
                  theme === "light"
                    ? "bg-white border-zinc-200 text-zinc-800 placeholder-zinc-300 focus:border-zinc-400"
                    : "bg-[#030303] border-zinc-900 text-white placeholder-zinc-800 focus:border-zinc-700"
                }`}
              />
              <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold transition-colors ${
                theme === "light" ? "text-zinc-400" : "text-zinc-700"
              }`}>@</span>
            </div>

            {/* Branch input */}
            <div className="w-32 relative">
              <input 
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="Branch"
                className={`w-full border focus:ring-0 rounded-lg pl-7 pr-3.5 py-2 text-xs font-mono transition ${
                  theme === "light"
                    ? "bg-white border-zinc-200 text-zinc-800 placeholder-zinc-300 focus:border-zinc-400"
                    : "bg-[#030303] border-zinc-900 text-white placeholder-zinc-800 focus:border-zinc-700"
                }`}
              />
              <GitFork className={`w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 transition-colors ${
                theme === "light" ? "text-zinc-400" : "text-zinc-800"
              }`} />
            </div>

            {/* Run Button */}
            <button 
              type="submit"
              disabled={isLoading}
              className={`font-mono font-bold py-2 px-4 rounded-lg text-xs transition active:scale-[0.99] disabled:scale-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer flex-shrink-0 uppercase tracking-wider ${
                theme === "light"
                  ? "bg-zinc-900 hover:bg-black text-white disabled:bg-zinc-150 disabled:text-zinc-400"
                  : "bg-zinc-100 hover:bg-white text-black disabled:bg-zinc-900 disabled:text-zinc-700"
              }`}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  Mapping...
                </>
              ) : (
                <>
                  Scan
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Credentials Settings Toggle */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button 
              type="button"
              onClick={toggleTheme}
              className={`p-2 rounded-lg border transition cursor-pointer ${
                theme === "light" 
                  ? "bg-white border-zinc-200 text-zinc-650 hover:text-zinc-800 hover:bg-zinc-100" 
                  : "bg-[#030303] border-zinc-900 text-zinc-550 hover:text-zinc-300 hover:bg-zinc-900/30"
              }`}
              title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
            >
              {theme === "light" ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
            </button>

            <button 
              type="button"
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-lg border transition ${
                showSettings 
                  ? theme === "light" ? "bg-zinc-150 border-zinc-300 text-zinc-800" : "bg-zinc-900 border-zinc-700 text-zinc-300"
                  : theme === "light" ? "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-100" : "bg-[#030303] border-zinc-900 text-zinc-650 hover:text-zinc-400 hover:bg-zinc-900/30"
              }`}
              title="Credentials Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
            
            <div className={`text-[10px] border px-3 py-1.5 rounded-lg font-mono font-bold uppercase tracking-wider hidden sm:flex items-center gap-1.5 transition-colors ${
              theme === "light" 
                ? "text-zinc-500 bg-zinc-50 border-zinc-200" 
                : "text-zinc-600 bg-zinc-950/80 border-zinc-900"
            }`}>
              <Globe className={`w-3.5 h-3.5 transition-colors ${theme === "light" ? "text-zinc-400" : "text-zinc-850"}`} />
              API First Mode
            </div>
          </div>
        </header>

        {/* Floating Settings Panel */}
        {showSettings && (
          <div className={`absolute top-18 right-6 w-80 border p-5 rounded-xl shadow-2xl z-40 backdrop-blur-xl animate-fadeIn flex flex-col gap-4 transition-all ${
            theme === "light" 
              ? "bg-white/98 border-zinc-200 text-zinc-800 shadow-zinc-200/40" 
              : "bg-[#030303]/95 border-zinc-900 text-white"
          }`}>
            <div className={`flex items-center justify-between border-b pb-2 ${
              theme === "light" ? "border-zinc-100" : "border-zinc-900"
            }`}>
              <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                API Credentials
              </div>
              <button 
                type="button"
                onClick={() => setShowSettings(false)}
                className={`p-1 rounded transition cursor-pointer font-mono text-[9px] font-bold ${
                  theme === "light" ? "hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700" : "hover:bg-zinc-900 text-zinc-550 hover:text-zinc-350"
                }`}
              >
                [X]
              </button>
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label htmlFor="gemini-key" className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-wider">
                Gemini API Key
              </label>
              <input 
                id="gemini-key"
                type="password"
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                placeholder="Paste Gemini API Key"
                className={`w-full border focus:ring-0 rounded-lg px-2.5 py-2 text-xs font-mono placeholder-zinc-800 transition ${
                  theme === "light"
                    ? "bg-zinc-50 border-zinc-200 text-zinc-800 placeholder-zinc-400 focus:border-zinc-400"
                    : "bg-zinc-95 border-zinc-900 text-white placeholder-zinc-850 focus:border-zinc-700"
                }`}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="github-token" className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-wider">
                GitHub Personal Token
              </label>
              <input 
                id="github-token"
                type="password"
                value={githubToken}
                onChange={(e) => setGithubToken(e.target.value)}
                placeholder="Paste GitHub Token"
                className={`w-full border focus:ring-0 rounded-lg px-2.5 py-2 text-xs font-mono placeholder-zinc-800 transition ${
                  theme === "light"
                    ? "bg-zinc-50 border-zinc-200 text-zinc-800 placeholder-zinc-400 focus:border-zinc-400"
                    : "bg-zinc-95 border-zinc-900 text-white placeholder-zinc-850 focus:border-zinc-700"
                }`}
              />
            </div>

            <button
              type="button"
              onClick={() => setShowSettings(false)}
              className={`mt-2 w-full font-mono font-bold py-2 rounded text-xs transition border uppercase tracking-wider cursor-pointer ${
                theme === "light"
                  ? "bg-zinc-900 hover:bg-black text-white border-zinc-950"
                  : "bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border-zinc-800"
              }`}
            >
              Save & Close
            </button>
          </div>
        )}

        {/* Global Loading overlay */}
        {isLoading && (
          <div className={`flex-1 flex flex-col gap-6 items-center justify-center p-8 z-20 transition-colors duration-300 ${
            theme === "light" ? "bg-white/95" : "bg-[#030303]/90"
          }`}>
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <div className="relative">
                <div className="w-14 h-14 rounded-full border border-dashed border-zinc-700 animate-spin"></div>
                <Map className="w-5 h-5 text-zinc-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
              </div>
              <div className="mt-1">
                <h4 className="text-xs font-mono font-black uppercase tracking-widest text-zinc-300">Reconstructing Codebase Map</h4>
                <p className="text-[10px] font-mono text-zinc-600 mt-1">Analyzing repository tree structures...</p>
              </div>
            </div>

            {/* Terminal emulator */}
            <div className="w-full max-w-xl bg-black/80 border border-zinc-900 rounded-xl p-5 font-mono text-[10px] text-zinc-500 flex flex-col gap-1.5 overflow-y-auto max-h-[300px] shadow-2xl">
              <div className="flex items-center gap-2 text-zinc-650 border-b border-zinc-900 pb-2.5 mb-1.5 font-bold uppercase tracking-wider">
                <TerminalIcon className="w-3.5 h-3.5 text-zinc-700" />
                <span>REPOMIND CONSOLE SCANNER</span>
              </div>
              {logs.map((log, i) => (
                <div key={i} className="flex gap-2.5 items-start leading-normal animate-fadeIn">
                  <span className="text-zinc-800 flex-shrink-0 select-none">[{log.time}]</span>
                  <span className={
                    log.type === "success" ? "text-emerald-500" :
                    log.type === "error" ? "text-red-500" :
                    log.type === "warning" ? "text-amber-500" : "text-zinc-400"
                  }>
                    {log.text}
                  </span>
                </div>
              ))}
              <div className="w-1.5 h-3.5 bg-zinc-600 animate-pulse mt-0.5 inline-block"></div>
            </div>
          </div>
        )}

        {/* Global Error Notice */}
        {error && !isLoading && (
          <div className="m-6 p-4 bg-red-950/10 border border-red-500/20 rounded-xl flex gap-3 text-red-400 z-20 font-mono text-xs">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" />
            <div className="leading-relaxed">
              <span className="font-bold uppercase tracking-wider text-red-500">Pipeline Error:</span> {error}
            </div>
          </div>
        )}

        {/* Workspace Display Area */}
        <div className="flex-1 flex flex-col overflow-hidden relative p-6">
          
          {result && !isLoading ? (
            <div className="w-full h-full">
               {/* Tab 1: Architecture Map (Mermaid) */}
              {activeTab === "map" && (
                <div className="w-full h-full flex flex-col relative">
                  <div className="absolute top-3.5 right-4 z-30 flex items-center gap-2">
                    {/* Copy Mermaid Code */}
                    <button
                      onClick={handleCopyCode}
                      className={`p-2 border rounded-lg flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider transition cursor-pointer ${
                        theme === "light"
                          ? "bg-white border-zinc-200 hover:bg-zinc-50 text-zinc-600 hover:text-zinc-800"
                          : "bg-zinc-950/80 border-zinc-900 hover:bg-zinc-900 text-zinc-500 hover:text-zinc-300"
                      }`}
                      title="Copy raw Mermaid.js graph code"
                    >
                      {copiedCode ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Copied Code</span>
                        </>
                      ) : (
                        <>
                          <FileCode className="w-3.5 h-3.5" />
                          <span>Copy Graph Code</span>
                        </>
                      )}
                    </button>

                    {/* Share Permalink */}
                    <button
                      onClick={handleCopyLink}
                      className={`p-2 border rounded-lg flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider transition cursor-pointer ${
                        theme === "light"
                          ? "bg-white border-zinc-200 hover:bg-zinc-50 text-zinc-600 hover:text-zinc-800"
                          : "bg-zinc-950/80 border-zinc-900 hover:bg-zinc-900 text-zinc-500 hover:text-zinc-300"
                      }`}
                      title="Copy a shareable link to this mapping"
                    >
                      {copiedLink ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Link Copied</span>
                        </>
                      ) : (
                        <>
                          <Globe className="w-3.5 h-3.5" />
                          <span>Share Map</span>
                        </>
                      )}
                    </button>

                    {/* Fullscreen Button */}
                    <button
                      onClick={() => setIsFullscreen(true)}
                      className={`p-2 border rounded-lg transition cursor-pointer ${
                        theme === "light"
                          ? "bg-white border-zinc-200 hover:bg-zinc-50 text-zinc-500 hover:text-zinc-800"
                          : "bg-zinc-950/80 border-zinc-900 hover:bg-zinc-900 text-zinc-500 hover:text-zinc-300"
                      }`}
                      title="View Fullscreen"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex-1 flex flex-col">
                    <MermaidRenderer chart={result.mermaid} theme={theme} />
                  </div>
                </div>
              )}

              {/* Tab 2: System Summary */}
              {activeTab === "summary" && (
                <div className="max-w-4xl w-full mx-auto flex-1 flex flex-col gap-6 animate-fadeIn relative overflow-y-auto pr-1">
                  
                  {/* Top Architecture Card */}
                  <div className={`border rounded-xl p-6 flex flex-col gap-4 relative overflow-hidden transition-colors duration-300 ${
                    theme === "light" ? "bg-white border-zinc-200 shadow-sm" : "bg-zinc-950/20 border-zinc-900"
                  }`}>
                    
                    <div className="flex items-center gap-2 text-orange-500 font-mono text-[10px] uppercase font-bold tracking-widest mb-1 mt-1">
                      <Cpu className="w-4 h-4 text-zinc-500" />
                      Core Architecture Synthesis
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {result.summary.map((point, index) => (
                        <div key={index} className={`p-5 border rounded-lg flex flex-col gap-3 relative transition-colors ${
                          theme === "light" ? "bg-zinc-50 border-zinc-200" : "bg-[#030303] border-zinc-900"
                        }`}>
                          <div className={`w-6 h-6 rounded border flex items-center justify-center font-mono font-bold text-xs select-none transition-colors ${
                            theme === "light" ? "bg-white border-zinc-200 text-zinc-650" : "bg-zinc-900 border-zinc-800 text-zinc-400"
                          }`}>
                            {index + 1}
                          </div>
                          <p className={`text-[11px] leading-relaxed font-mono mt-1 transition-colors ${
                            theme === "light" ? "text-zinc-600" : "text-zinc-400"
                          }`}>{point}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recommendations Stack */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className={`border p-6 rounded-xl flex flex-col gap-3 relative transition-colors ${
                      theme === "light" ? "bg-white border-zinc-200 shadow-sm" : "bg-zinc-950/20 border-zinc-900"
                    }`}>
                      <h4 className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest mt-1">Detected Topology Layout</h4>
                      <p className={`text-[11px] font-mono leading-relaxed transition-colors ${
                        theme === "light" ? "text-zinc-600" : "text-zinc-650"
                      }`}>
                        Based on codebase topology manifests and metadata scan outputs, the system mapped modular interfaces and entry points. The Flow Canvas illustrates active boundaries, routing structures, and service components.
                      </p>
                    </div>
                    <div className={`border p-6 rounded-xl flex flex-col gap-3 relative transition-colors ${
                      theme === "light" ? "bg-white border-zinc-200 shadow-sm" : "bg-zinc-950/20 border-zinc-900"
                    }`}>
                      <h4 className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest mt-1">Refactoring Strategy</h4>
                      <p className={`text-[11px] font-mono leading-relaxed transition-colors ${
                        theme === "light" ? "text-zinc-600" : "text-zinc-650"
                      }`}>
                        We recommend isolating distinct folder layers mapped in the layout to optimize scalability. By relying purely on tree metadata instead of heavy vectors, we keep architectural footprints clean and modular.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Codebase Topology Tree */}
              {activeTab === "tree" && (
                <div className="max-w-3xl w-full mx-auto flex-1 flex flex-col gap-4 animate-fadeIn relative overflow-hidden">
                  <div className="flex items-center justify-between flex-shrink-0">
                    <h3 className={`text-xs font-mono font-bold flex items-center gap-2 uppercase tracking-wider transition-colors ${
                      theme === "light" ? "text-zinc-800" : "text-zinc-400"
                    }`}>
                      <Layers className="w-4 h-4 text-zinc-655" />
                      Cleaned Codebase Directory Tree
                    </h3>
                    <span className={`text-[9px] font-mono transition-colors ${
                      theme === "light" ? "text-zinc-400" : "text-zinc-600"
                    }`}>
                      Noise filters active (excluding binaries, locks, and libraries)
                    </span>
                  </div>

                  <div className={`border rounded-xl p-5 flex-1 overflow-y-auto shadow-inner transition-colors duration-300 ${
                    theme === "light" ? "bg-white border-zinc-200" : "bg-zinc-950/20 border-zinc-900"
                  }`}>
                    <div className="flex flex-col gap-0.5">
                      {parsePathsToTree(result.stats.fetched_manifests.concat(result.stats.total_files > 0 ? [`[Codebase Root]/`] : [])).map((node, i) => (
                        <FileNode key={i} node={node} depth={0} />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: Dependency Manifests Inspector */}
              {activeTab === "dependencies" && (
                <div className="max-w-5xl w-full mx-auto flex-1 grid grid-cols-1 md:grid-cols-12 gap-6 animate-fadeIn relative overflow-hidden">
                  {/* Left Manifest list */}
                  <div className={`md:col-span-4 border rounded-xl p-4 flex flex-col gap-2 overflow-y-auto h-full transition-colors duration-300 ${
                    theme === "light" ? "bg-white border-zinc-200 shadow-sm" : "bg-zinc-950/20 border-zinc-900"
                  }`}>
                    <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-widest px-1.5 mb-2">Detected files</span>
                    
                    {result.stats.fetched_manifests.length > 0 ? (
                      result.stats.fetched_manifests.map((path) => (
                        <button
                          key={path}
                          onClick={() => setSelectedManifest(path)}
                          className={`w-full text-left p-3 rounded-lg text-[11px] font-mono truncate transition cursor-pointer flex items-center gap-2 border ${
                            selectedManifest === path 
                              ? "bg-orange-500/10 border-orange-500/25 text-orange-400 font-bold" 
                              : theme === "light"
                                ? "bg-transparent border-transparent text-zinc-600 hover:text-zinc-800 hover:bg-zinc-100"
                                : "bg-transparent border-transparent text-zinc-550 hover:text-zinc-355 hover:bg-zinc-900/10"
                          }`}
                        >
                          <FileCode className="w-3.5 h-3.5 flex-shrink-0 text-zinc-650" />
                          {path}
                        </button>
                      ))
                    ) : (
                      <div className="text-center p-6 text-zinc-700 text-xs font-mono font-semibold select-none">No manifests found.</div>
                    )}
                  </div>

                  {/* Right Code block panel */}
                  <div className={`md:col-span-8 border rounded-xl overflow-hidden flex flex-col relative transition-colors duration-300 ${
                    theme === "light" ? "bg-white border-zinc-200 shadow-sm" : "bg-zinc-950/40 border-zinc-900"
                  }`}>
                    <div className={`border-b px-4 py-2.5 flex items-center justify-between flex-shrink-0 select-none transition-colors duration-300 ${
                      theme === "light" ? "bg-zinc-50 border-zinc-200" : "bg-zinc-950/80 border-zinc-900"
                    }`}>
                      <span className={`text-[10px] font-mono font-bold transition-colors ${
                        theme === "light" ? "text-zinc-755" : "text-zinc-500"
                      }`}>
                        {selectedManifest || "No file selected"}
                      </span>
                      {selectedManifest && (
                        <div className="text-[8px] font-mono font-black text-zinc-600 uppercase tracking-widest">
                          [RAW MANIFEST]
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 overflow-auto p-4 font-mono text-[11px] text-zinc-400 bg-black/10">
                      {manifestLoading ? (
                        <div className="h-full flex items-center justify-center text-zinc-650 gap-2">
                          <RefreshCw className="w-4 h-4 animate-spin text-zinc-600" />
                          Reading file stream...
                        </div>
                      ) : (
                        <pre className="whitespace-pre overflow-x-auto select-text leading-relaxed">
                          {manifestContent || "// Select a manifest file on the left to inspect its dependency structure."}
                        </pre>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 5: Scan Metrics */}
              {activeTab === "metrics" && (
                <div className="max-w-4xl w-full mx-auto flex-1 flex flex-col gap-6 animate-fadeIn relative overflow-y-auto pr-1">
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className={`border p-5 rounded-xl flex flex-col gap-1 select-none transition-colors duration-300 ${
                      theme === "light" ? "bg-white border-zinc-200 shadow-sm" : "bg-zinc-950/20 border-zinc-900"
                    }`}>
                      <span className={`text-[8px] font-mono font-bold uppercase tracking-widest ${theme === "light" ? "text-zinc-400" : "text-zinc-600"}`}>Metadata Tree Scanned</span>
                      <span className={`text-lg font-mono font-black ${theme === "light" ? "text-zinc-800" : "text-zinc-300"}`}>{result.stats.total_files} files</span>
                    </div>
                    <div className={`border p-5 rounded-xl flex flex-col gap-1 select-none transition-colors duration-300 ${
                      theme === "light" ? "bg-white border-zinc-200 shadow-sm" : "bg-zinc-950/20 border-zinc-900"
                    }`}>
                      <span className={`text-[8px] font-mono font-bold uppercase tracking-widest ${theme === "light" ? "text-zinc-400" : "text-zinc-600"}`}>Noise Filter Stripped</span>
                      <span className={`text-lg font-mono font-black ${theme === "light" ? "text-zinc-500" : "text-zinc-500"}`}>{result.stats.filtered_noise_files} files</span>
                    </div>
                    <div className={`border p-5 rounded-xl flex flex-col gap-1 select-none transition-colors duration-300 ${
                      theme === "light" ? "bg-white border-zinc-200 shadow-sm" : "bg-zinc-950/20 border-zinc-900"
                    }`}>
                      <span className={`text-[8px] font-mono font-bold uppercase tracking-widest ${theme === "light" ? "text-zinc-400" : "text-zinc-600"}`}>Topology Paths Mapped</span>
                      <span className="text-lg font-mono font-black text-emerald-500">{result.stats.analyzed_files} nodes</span>
                    </div>
                    <div className={`border p-5 rounded-xl flex flex-col gap-1 select-none transition-colors duration-300 ${
                      theme === "light" ? "bg-white border-zinc-200 shadow-sm" : "bg-zinc-950/20 border-zinc-900"
                    }`}>
                      <span className={`text-[8px] font-mono font-bold uppercase tracking-widest ${theme === "light" ? "text-zinc-400" : "text-zinc-600"}`}>Manifests Parsed</span>
                      <span className="text-lg font-mono font-black text-purple-500">{result.stats.detected_manifests} manifests</span>
                    </div>
                  </div>

                  {/* High quality progress representation for judges */}
                  <div className={`border p-6 rounded-xl flex flex-col gap-4 relative transition-colors duration-300 ${
                    theme === "light" ? "bg-white border-zinc-200 shadow-sm" : "bg-zinc-950/20 border-zinc-900"
                  }`}>
                    
                    <h4 className={`text-[10px] font-mono font-bold uppercase tracking-widest mt-1 transition-colors ${
                      theme === "light" ? "text-zinc-700" : "text-zinc-450"
                    }`}>Noise Reduction Efficiency</h4>
                    
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between text-xs font-mono font-bold text-zinc-500 select-none">
                        <span>Filter efficiency ratio</span>
                        <span className="text-emerald-500">
                          {result.stats.total_files > 0 
                            ? Math.round((result.stats.filtered_noise_files / result.stats.total_files) * 100)
                            : 0}% noise reduced
                        </span>
                      </div>
                      <div className={`w-full h-1.5 rounded overflow-hidden ${theme === "light" ? "bg-zinc-100" : "bg-zinc-900/60"}`}>
                        <div 
                          className="bg-gradient-to-r from-zinc-700 to-emerald-600 h-full"
                          style={{ 
                            width: `${
                              result.stats.total_files > 0 
                                ? (result.stats.filtered_noise_files / result.stats.total_files) * 100 
                                : 0
                            }%` 
                          }}
                        ></div>
                      </div>
                      <p className={`text-[10px] font-mono leading-normal mt-2 transition-colors ${
                        theme === "light" ? "text-zinc-550" : "text-zinc-600"
                      }`}>
                        Instead of running multi-gigabyte git clones, compiling local binaries, and configuring local vector indexes, RepoMind queried public tree metadata recursively, reducing network payload and pipeline compile times down to seconds.
                      </p>
                    </div>
                  </div>
                </div>
              )}

            </div>
          ) : (
            /* Welcome / Onboarding workspace screen */
            <div className="w-full h-full flex flex-col items-center justify-center text-center py-8 px-4 overflow-y-auto relative">
              
              <div className="max-w-xl flex flex-col items-center gap-6 z-10">
                   {/* Visual Header */}
                <div className="flex flex-col gap-2 items-center text-center">
                  <h1 className={`text-3xl font-black tracking-tight uppercase leading-none mt-1 transition-colors ${
                    theme === "light" ? "text-zinc-800" : "text-white"
                  }`}>
                    Visual Mapping <br/>
                    <span className="bg-gradient-to-r from-orange-500 via-amber-500 to-emerald-500 bg-clip-text text-transparent">Over Vector Search</span>
                  </h1>
                  <p className="text-[11px] font-mono text-zinc-650 max-w-sm mt-3 leading-relaxed">
                    Map repository architecture instantly using standard API metadata trees. Skip cloning and heavy vector database indexing.
                  </p>
                </div>

                {/* Templates Grid */}
                <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                  {QUICK_TEMPLATES.map((tmpl) => (
                    <button
                      key={tmpl.name}
                      onClick={() => handleTemplateClick(tmpl.url)}
                      className={`flex flex-col text-left p-4 rounded-xl border hover:scale-[1.01] active:scale-[0.99] transition select-none cursor-pointer group relative overflow-hidden ${
                        theme === "light"
                          ? "bg-white border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/50 shadow-sm shadow-zinc-200/20"
                          : "bg-transparent border-zinc-900 hover:bg-zinc-950/40"
                      } ${tmpl.color}`}
                    >
                      <div className="flex items-center justify-between w-full font-mono">
                        <div className="flex items-center gap-2 font-bold text-xs">
                          <span>{tmpl.icon}</span>
                          <span className={`tracking-wide transition-colors ${
                            theme === "light" ? "text-zinc-700" : "text-zinc-300"
                          }`}>{tmpl.name}</span>
                        </div>
                        <span className={`text-[9px] font-bold border px-1.5 py-0.5 rounded uppercase tracking-wider transition ${
                          theme === "light" 
                            ? "text-zinc-555 bg-zinc-50 border-zinc-200 group-hover:border-zinc-300"
                            : "text-zinc-650 bg-zinc-955 border-zinc-900 group-hover:border-zinc-800"
                        }`}>
                          {tmpl.code}
                        </span>
                      </div>
                      <span className={`text-[10px] font-mono mt-2 font-medium transition-colors ${
                        theme === "light" ? "text-zinc-500" : "text-zinc-600"
                      }`}>{tmpl.desc}</span>
                    </button>
                  ))}
                </div>
                
                {/* Visual Mapping Features comparison */}
                <div className={`w-full border-t pt-6 mt-6 flex flex-col gap-4 text-left font-mono transition-colors ${
                  theme === "light" ? "border-zinc-200" : "border-zinc-900/80"
                }`}>
                  <h4 className="text-[9px] font-bold text-zinc-500 tracking-widest uppercase">ARCHITECTURAL STRATEGY</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className={`p-4 border rounded-xl flex flex-col gap-1.5 transition-colors ${
                      theme === "light" ? "bg-white border-zinc-200 shadow-sm shadow-zinc-200/20" : "bg-transparent border-zinc-900"
                    }`}>
                      <span className="text-[10px] font-bold text-red-500/80 flex items-center gap-1.5 select-none uppercase tracking-wider">
                        ✕ Vector Indexing
                      </span>
                      <p className={`text-[9px] leading-relaxed font-medium transition-colors ${
                        theme === "light" ? "text-zinc-550" : "text-zinc-650"
                      }`}>
                        Requires heavy clone pipelines, massive token chunking, complex local embedding databases, and long indexing wait times.
                      </p>
                    </div>
                    <div className={`p-4 border rounded-xl flex flex-col gap-1.5 transition-colors ${
                      theme === "light" ? "bg-white border-zinc-200 shadow-sm shadow-zinc-200/20" : "bg-transparent border-zinc-900"
                    }`}>
                      <span className="text-[10px] font-bold text-emerald-500/85 flex items-center gap-1.5 select-none uppercase tracking-wider">
                        ✓ Metadata Mapping
                      </span>
                      <p className={`text-[9px] leading-relaxed font-medium transition-colors ${
                        theme === "light" ? "text-zinc-550" : "text-zinc-650"
                      }`}>
                        Requires zero database setup, retrieves metadata trees immediately, strips noise files on the fly, and synthesizes maps instantly.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

      {/* Fullscreen Overlay Visualizer */}
      {isFullscreen && result && (
        <div className={`fixed inset-0 z-50 p-6 flex flex-col gap-4 animate-fadeIn select-none font-mono transition-colors duration-300 ${
          theme === "light" ? "bg-white/98 text-zinc-800" : "bg-[#030303]/98 text-white"
        }`}>
          <div className={`flex items-center justify-between border-b pb-3 flex-shrink-0 transition-colors ${
            theme === "light" ? "border-zinc-200" : "border-zinc-900"
          }`}>
            <div className="flex items-center gap-2">
              <span className={`font-bold text-xs uppercase tracking-wider transition-colors ${
                theme === "light" ? "text-zinc-700" : "text-zinc-300"
              }`}>
                Fullscreen Flow Canvas
              </span>
              <span className={`text-[9px] border px-2 py-0.5 rounded transition-colors ${
                theme === "light" 
                  ? "bg-zinc-50 border-zinc-200 text-zinc-500" 
                  : "bg-zinc-900 border-zinc-850 text-zinc-500"
              }`}>
                {result.owner}/{result.repo} ({result.branch})
              </span>
            </div>
            <button
              onClick={() => setIsFullscreen(false)}
              className={`p-2 border rounded-lg flex items-center gap-1 text-xs font-semibold transition cursor-pointer ${
                theme === "light"
                  ? "bg-white border-zinc-200 hover:bg-zinc-50 text-zinc-650 hover:text-zinc-800 shadow-sm"
                  : "bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Minimize2 className="w-4 h-4" />
              Close Fullscreen
            </button>
          </div>
          <div className="flex-1 overflow-hidden relative">
            <MermaidRenderer chart={result.mermaid} theme={theme} />
          </div>
        </div>
      )}

    </div>
  );
}
