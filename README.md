# RepoMind AI 🧠

<div align="center">
  <p><strong>Reconstruct Codebase Architecture Instantly. Over Vector Search.</strong></p>

  [![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
  [![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
  [![Gemini 2.5](https://img.shields.io/badge/Gemini%202.5-8E75C2?style=for-the-badge&logo=googlegemini&logoColor=white)](https://ai.google.dev/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
</div>

---

RepoMind AI is a premium, Awwwards-style developer workspace tool that visualizes repository codebase architectures in seconds. By parsing remote directory structures and configuration files recursively, it reconstructs modular flowcharts and folder hierarchies without ever executing heavy local clones, Docker runs, or resource-heavy vector database indexing.

---

## 🗺️ Architectural Strategy: Visual Mapping vs. Vector Search

| Feature | ✕ Vector Indexing (Traditional) | ✓ Metadata Mapping (RepoMind) |
| :--- | :--- | :--- |
| **Clone Latency** | High (downloads gigabytes of code, assets, binaries) | **Zero** (extracts directory lists in seconds via API) |
| **Setup Time** | Minutes/Hours (embedding models, database setup) | **Instant** (queries public trees on demand) |
| **Token Cost** | Extremely High (feeds entire file chunks into LLM) | **Extremely Low** (sends only topology trees & manifests) |
| **Security Risk** | High (stores raw source code in vector indexes) | **Minimal** (reads only manifests; stores keys in browser storage) |

---

## 🌟 Key Features

1. 🗺️ **Interactive Flow Canvas**: Renders fully zoomable and pannable Mermaid.js flowcharts compiled by Gemini 2.5 Flash. Export visuals directly as vectors (**SVG**) or high-res images (**PNG**), copy the raw Mermaid code, or view in solid, opaque Fullscreen.
2. 📁 **Topology Tree & Code Inspector**: Explore a nested directory structure filtering out binaries, libraries, and caches. **Click any file to slide open the Source File Inspector drawer** and inspect code files directly using GitHub APIs.
3. 📦 **Manifest Inspector**: A side-by-side split screen viewer that displays package configuration files (such as `package.json` or `requirements.txt`) with line numbers.
4. 📊 **Ecosystem Composition Dashboard**: A visual dashboard showcasing codebase maintainability scorecards, language distribution bars, noise reduction ratios, and real-time execution statistics.
5. 🔗 **Shareable Permalinks**: Share scans directly using permalink parameters (`?repo=<owner>/<repo>&branch=<name>`). Landing on the workspace with parameters automatically triggers codebase scanning.
6. 🔒 **API First & Secure**: All credentials (Gemini keys, GitHub tokens) are stored locally in the browser's `localStorage` and never saved on the server. Mermaid XSS protection is set to `strict`.

---

## 🛠️ Tech Stack

* **Frontend**: Next.js 16 (App Router), Tailwind CSS v3, TypeScript, Mermaid.js, Lucide Icons
* **Backend**: FastAPI, Uvicorn, Google GenAI SDK (Python 3.10+)

---

## 🚀 Local Installation & Setup

### 1. Prerequisites
* [Node.js](https://nodejs.org/) (v18+)
* [Python 3.10+](https://www.python.org/)

### 2. Backend Installation (FastAPI)
Navigate to the `backend/` directory:
```bash
cd backend
```

Create a virtual environment and activate it:
* **Windows (PowerShell)**:
  ```powershell
  python -m venv .venv
  .\.venv\Scripts\Activate.ps1
  ```
* **macOS / Linux**:
  ```bash
  python3 -m venv .venv
  source .venv/bin/activate
  ```

Install dependencies:
```bash
pip install -r requirements.txt
```

Create your `.env` configuration:
```bash
cp .env.example .env
```
*(Optionally paste your `GEMINI_API_KEY` and `GITHUB_TOKEN` inside `.env` to load them automatically, or pass them inside the Web UI settings).*

Launch the backend server:
```bash
python main.py
```
The server will start running on **`http://127.0.0.1:8000`**.

---

### 3. Frontend Installation (Next.js)
Return to the root workspace directory and install Node packages:
```bash
npm install
```

Launch the development workspace:
```bash
npm run dev
```
Open **`http://localhost:3000`** in your browser.

---

## ☁️ Production Cloud Deployment (No Docker)

RepoMind is configured for immediate cloud deployment using direct native git integrations:

### 1. Backend Deployment (Render)
1. Deploy the `/backend` folder.
2. Select **Python 3** runtime.
3. Build Command: `pip install -r requirements.txt`
4. Start Command: `python main.py`
5. Configure the following **Environment Variables** in the Render Dashboard:
   * `ENVIRONMENT` = `production`
   * `GEMINI_API_KEY` = `your_gemini_api_key` (Google AI Studio Key)
   * `GITHUB_TOKEN` = `your_github_token` (Optional GitHub PAT)

### 2. Frontend Deployment (Vercel)
1. Import your repository into Vercel (Preset: Next.js).
2. Configure the following **Environment Variable** in the Vercel Dashboard:
   * `NEXT_PUBLIC_API_URL` = `https://your-backend-live-url.onrender.com` (Your live Render backend address)
3. Deploy! Vercel will optimize and serve your frontend pages statically.

