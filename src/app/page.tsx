"use client";

import { useEffect, useState } from "react";
import { 
  ArrowRight, 
  Map, 
  Layers, 
  FileCode, 
  Cpu, 
  Zap, 
  Check, 
  GitFork, 
  ShieldCheck, 
  Globe,
  Sun,
  Moon
} from "lucide-react";

export default function Home() {
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

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const isLight = theme === "light";

  return (
    <div className={`min-h-screen w-full relative overflow-x-hidden font-sans select-none scroll-smooth transition-colors duration-300 ${
      isLight ? "theme-light bg-[#f8f8fa] text-zinc-800" : "bg-[#020203] text-zinc-100"
    }`}>
      {/* Structural layout dividers (Awwwards blueprint styling) */}
      <div className="blueprint-overlay absolute inset-0 pointer-events-none z-0"></div>
      <div className="awwwards-grid absolute inset-0 pointer-events-none z-0"></div>

      {/* Global Product Header */}
      <header className={`h-16 border-b px-6 flex items-center justify-between sticky top-0 z-50 transition-colors duration-300 ${
        isLight ? "border-zinc-200 bg-[#f8f8fa]/90 backdrop-blur-md" : "border-zinc-900 bg-[#020203]/90 backdrop-blur-md"
      }`}>
        
        {/* Brand */}
        <div className="flex items-center gap-2 select-none">
          <span className="w-2.5 h-2.5 bg-orange-500 rounded-sm"></span>
          <span className={`font-mono text-xs font-black tracking-[0.2em] uppercase ${
            isLight ? "text-zinc-800" : "text-zinc-300"
          }`}>
            REPOMIND
          </span>
        </div>

        {/* Desktop Nav Links */}
        <nav className={`hidden md:flex items-center gap-8 font-mono text-[10px] uppercase tracking-wider font-bold transition-colors ${
          isLight ? "text-zinc-500 hover:text-zinc-800" : "text-zinc-500 hover:text-zinc-300"
        }`}>
          <button 
            onClick={() => scrollToSection("features")} 
            className={`transition cursor-pointer ${isLight ? "hover:text-zinc-800" : "hover:text-zinc-300"}`}
          >
            Features
          </button>
          <button 
            onClick={() => scrollToSection("docs")} 
            className={`transition cursor-pointer ${isLight ? "hover:text-zinc-800" : "hover:text-zinc-300"}`}
          >
            How it works
          </button>
          <button 
            onClick={() => scrollToSection("pricing")} 
            className={`transition cursor-pointer ${isLight ? "hover:text-zinc-800" : "hover:text-zinc-300"}`}
          >
            Pricing
          </button>
        </nav>

        {/* Action Controls (Theme Toggle + Launch) */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle Button */}
          <button 
            onClick={toggleTheme}
            className={`p-2 rounded-lg border transition cursor-pointer ${
              isLight 
                ? "bg-white border-zinc-200 text-zinc-650 hover:text-zinc-800 hover:bg-zinc-100" 
                : "bg-[#030303] border-zinc-900 text-zinc-550 hover:text-zinc-300 hover:bg-zinc-900/30"
            }`}
            title={isLight ? "Switch to Dark Mode" : "Switch to Light Mode"}
          >
            {isLight ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
          </button>

          <a 
            href="/workspace"
            className={`font-mono font-bold py-2 px-4 rounded-lg text-[10px] uppercase tracking-wider transition active:scale-[0.99] flex items-center gap-1.5 cursor-pointer shadow-sm ${
              isLight 
                ? "bg-zinc-900 hover:bg-black text-white shadow-zinc-200" 
                : "bg-zinc-100 hover:bg-white text-black shadow-zinc-500/5"
            }`}
          >
            Launch Workspace
            <ArrowRight className="w-3 h-3" />
          </a>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative px-6 py-24 md:py-36 max-w-5xl mx-auto flex flex-col items-center text-center z-10">

        {/* Small badge */}
        <div className="text-[10px] font-bold text-orange-500 font-mono tracking-[0.3em] uppercase mb-4 animate-pulse">
          // ZERO CLONE CODEBASE VISUALIZATION
        </div>

        {/* Editorial Heading */}
        <h1 className={`text-4xl sm:text-6xl font-black tracking-tight uppercase leading-none max-w-4xl transition-colors ${
          isLight ? "text-zinc-900" : "text-white"
        }`}>
          Reconstruct Codebase <br/>
          <span className="bg-gradient-to-r from-orange-500 via-amber-500 to-emerald-500 bg-clip-text text-transparent">
            Architecture Instantly
          </span>
        </h1>

        {/* Subtitle */}
        <p className={`text-xs sm:text-sm font-mono max-w-2xl mt-6 leading-relaxed ${
          isLight ? "text-zinc-500" : "text-zinc-500"
        }`}>
          Map repository architecture dynamically using public API metadata. Bypass heavy git clones, local native compilation failures, and resource-heavy vector database indexing.
        </p>

        {/* CTA triggers */}
        <div className="flex flex-col sm:flex-row gap-4 mt-10">
          <a 
            href="/workspace"
            className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-mono font-bold py-3 px-6 rounded-xl text-xs uppercase tracking-wider transition hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-orange-500/10"
          >
            Get Started Free
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
          <button 
            onClick={() => scrollToSection("features")}
            className={`font-mono font-bold py-3 px-6 rounded-xl text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer border ${
              isLight 
                ? "bg-transparent hover:bg-zinc-100 border-zinc-200 text-zinc-600 hover:text-zinc-800" 
                : "bg-transparent hover:bg-zinc-950 border-zinc-900 hover:border-zinc-800 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Explore Features
          </button>
        </div>
      </section>

      {/* Bento Grid Features Section */}
      <section id="features" className={`py-20 px-6 border-t relative transition-colors ${
        isLight ? "border-zinc-200 bg-zinc-50/30" : "border-zinc-900 bg-zinc-955/10"
      }`}>
        
        <div className="max-w-5xl mx-auto flex flex-col gap-12">
          
          <div className="flex flex-col gap-2 items-center text-center">
            <h2 className={`text-xl sm:text-2xl font-black font-mono uppercase tracking-wider transition-colors ${
              isLight ? "text-zinc-800" : "text-zinc-300"
            }`}>
              Core Capabilities
            </h2>
            <p className={`text-[11px] font-mono transition-colors ${
              isLight ? "text-zinc-500" : "text-zinc-500"
            }`}>
              Standard web utilities mapped recursively, styled for precision.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-4">
            {/* Feature 1 */}
            <div className={`md:col-span-8 rounded-xl p-6 relative overflow-hidden flex flex-col justify-between min-h-[240px] border transition-all ${
              isLight 
                ? "bg-white border-zinc-200 shadow-sm shadow-zinc-200/40" 
                : "bg-zinc-950/20 border-zinc-900"
            }`}>
              <div className={`flex items-center justify-between border-b pb-3 ${isLight ? "border-zinc-100" : "border-zinc-900"}`}>
                <h4 className="text-xs font-mono font-bold text-orange-500 uppercase tracking-widest">01 // Interactive Flow Canvas</h4>
                <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded uppercase border ${
                  isLight ? "text-zinc-400 bg-zinc-50 border-zinc-200" : "text-zinc-600 bg-zinc-900 border-zinc-850"
                }`}>active</span>
              </div>
              <div className="grid grid-cols-2 gap-4 font-mono text-[9px] mt-4 leading-normal">
                <div>
                  <div className={`font-bold uppercase tracking-wider ${isLight ? "text-zinc-400" : "text-zinc-500"}`}>// COMPILATION</div>
                  <div className={`mt-0.5 ${isLight ? "text-zinc-600" : "text-zinc-400"}`}>ENGINE: GEMINI_2.5_FLASH</div>
                  <div className={isLight ? "text-zinc-600" : "text-zinc-400"}>SCHEMA: MERMAID_FLOWCHART</div>
                </div>
                <div>
                  <div className={`font-bold uppercase tracking-wider ${isLight ? "text-zinc-400" : "text-zinc-500"}`}>// EXPORTABLE</div>
                  <div className={`mt-0.5 ${isLight ? "text-zinc-600" : "text-zinc-400"}`}>FORMATS: SVG_VECTOR / RAW_CODE</div>
                  <div className={isLight ? "text-zinc-600" : "text-zinc-400"}>INTERFACE: DYNAMIC_ZOOM_PAN</div>
                </div>
              </div>
              <p className={`text-[10px] font-mono mt-4 leading-relaxed border-t pt-3 ${
                isLight ? "text-zinc-600 border-zinc-100" : "text-zinc-500 border-zinc-900"
              }`}>
                Renders repository relationships into fully interactive, vector-based visual maps in real time.
              </p>
            </div>

            {/* Feature 2 */}
            <div className={`md:col-span-4 rounded-xl p-6 relative overflow-hidden flex flex-col justify-between min-h-[240px] border transition-all ${
              isLight 
                ? "bg-white border-zinc-200 shadow-sm shadow-zinc-200/40" 
                : "bg-zinc-950/20 border-zinc-900"
            }`}>
              <div className={`flex items-center justify-between border-b pb-3 ${isLight ? "border-zinc-100" : "border-zinc-900"}`}>
                <h4 className="text-xs font-mono font-bold text-orange-500 uppercase tracking-widest">02 // Topology Tree</h4>
                <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded uppercase border ${
                  isLight ? "text-zinc-400 bg-zinc-50 border-zinc-200" : "text-zinc-600 bg-zinc-900 border-zinc-850"
                }`}>active</span>
              </div>
              <div className="flex flex-col gap-2 font-mono text-[9px] mt-4 leading-normal">
                <div>
                  <div className={`font-bold uppercase tracking-wider ${isLight ? "text-zinc-400" : "text-zinc-500"}`}>// HIERARCHY</div>
                  <div className={`mt-0.5 ${isLight ? "text-zinc-600" : "text-zinc-400"}`}>FILTER: NOISE_EXCLUSIONS</div>
                  <div className={isLight ? "text-zinc-600" : "text-zinc-400"}>SKIPS: BINARIES, LOCKS, LIBS</div>
                </div>
              </div>
              <p className={`text-[10px] font-mono mt-4 leading-relaxed border-t pt-3 ${
                isLight ? "text-zinc-600 border-zinc-100" : "text-zinc-500 border-zinc-900"
              }`}>
                Monospace directory tree mapping excluding noise files recursively.
              </p>
            </div>

            {/* Feature 3 */}
            <div className={`md:col-span-4 rounded-xl p-6 relative overflow-hidden flex flex-col justify-between min-h-[240px] border transition-all ${
              isLight 
                ? "bg-white border-zinc-200 shadow-sm shadow-zinc-200/40" 
                : "bg-zinc-950/20 border-zinc-900"
            }`}>
              <div className={`flex items-center justify-between border-b pb-3 ${isLight ? "border-zinc-100" : "border-zinc-900"}`}>
                <h4 className="text-xs font-mono font-bold text-orange-500 uppercase tracking-widest">03 // Manifests</h4>
                <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded uppercase border ${
                  isLight ? "text-zinc-400 bg-zinc-50 border-zinc-200" : "text-zinc-600 bg-zinc-900 border-zinc-850"
                }`}>active</span>
              </div>
              <div className="flex flex-col gap-2 font-mono text-[9px] mt-4 leading-normal">
                <div>
                  <div className={`font-bold uppercase tracking-wider ${isLight ? "text-zinc-400" : "text-zinc-500"}`}>// RESOLUTION</div>
                  <div className={`mt-0.5 ${isLight ? "text-zinc-600" : "text-zinc-400"}`}>TARGETS: package.json / requirements.txt</div>
                  <div className={isLight ? "text-zinc-600" : "text-zinc-400"}>VIEWER: SPLIT_TERMINAL_CODE</div>
                </div>
              </div>
              <p className={`text-[10px] font-mono mt-4 leading-relaxed border-t pt-3 ${
                isLight ? "text-zinc-600 border-zinc-100" : "text-zinc-500 border-zinc-900"
              }`}>
                Side-by-side config inspector displaying raw dependency parameters.
              </p>
            </div>

            {/* Feature 4 */}
            <div className={`md:col-span-8 rounded-xl p-6 relative overflow-hidden flex flex-col justify-between min-h-[240px] border transition-all ${
              isLight 
                ? "bg-white border-zinc-200 shadow-sm shadow-zinc-200/40" 
                : "bg-zinc-950/20 border-zinc-900"
            }`}>
              <div className={`flex items-center justify-between border-b pb-3 ${isLight ? "border-zinc-100" : "border-zinc-900"}`}>
                <h4 className="text-xs font-mono font-bold text-orange-500 uppercase tracking-widest">04 // Scraper Engine</h4>
                <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded uppercase border ${
                  isLight ? "text-zinc-400 bg-zinc-50 border-zinc-200" : "text-zinc-600 bg-zinc-900 border-zinc-850"
                }`}>active</span>
              </div>
              <div className="grid grid-cols-2 gap-4 font-mono text-[9px] mt-4 leading-normal">
                <div>
                  <div className={`font-bold uppercase tracking-wider ${isLight ? "text-zinc-400" : "text-zinc-500"}`}>// NETWORK_LOAD</div>
                  <div className={`mt-0.5 ${isLight ? "text-zinc-600" : "text-zinc-400"}`}>SOURCE: GITHUB_REST_NODES</div>
                  <div className={isLight ? "text-zinc-600" : "text-zinc-400"}>DB: ZERO_INDEX_STATIC</div>
                </div>
                <div>
                  <div className={`font-bold uppercase tracking-wider ${isLight ? "text-zinc-400" : "text-zinc-500"}`}>// EFFICIENCY</div>
                  <div className={`mt-0.5 ${isLight ? "text-zinc-600" : "text-zinc-400"}`}>SPEED: &lt; 5s SCANS</div>
                  <div className={isLight ? "text-zinc-600" : "text-zinc-400"}>METRICS: NOISE_RATIO_ANALYZER</div>
                </div>
              </div>
              <p className={`text-[10px] font-mono mt-4 leading-relaxed border-t pt-3 ${
                isLight ? "text-zinc-600 border-zinc-100" : "text-zinc-500 border-zinc-900"
              }`}>
                Pulls directory structures recursively directly via endpoints to prevent heavy local clonings.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* HOW IT WORKS / DOCS SECTION */}
      <section id="docs" className={`py-20 px-6 border-t relative transition-colors ${
        isLight ? "border-zinc-200 bg-white" : "border-zinc-900 bg-transparent"
      }`}>
        
        <div className="max-w-4xl mx-auto flex flex-col gap-12">
          
          <div className="flex flex-col gap-2 items-center text-center">
            <h2 className={`text-xl sm:text-2xl font-black font-mono uppercase tracking-wider transition-colors ${
              isLight ? "text-zinc-800" : "text-zinc-300"
            }`}>
              System Schematics
            </h2>
            <p className={`text-[11px] font-mono transition-colors ${
              isLight ? "text-zinc-500" : "text-zinc-500"
            }`}>
              Our zero-clone architecture pipelines codebase mapping steps:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8 relative">
            {/* Horizontal connection line behind nodes for desktop */}
            <div className={`hidden md:block absolute top-[2.45rem] left-6 right-6 h-[1px] z-0 ${
              isLight ? "bg-zinc-200" : "bg-zinc-900"
            }`}></div>

            {/* Step 1 */}
            <div className={`border rounded-xl p-6 flex flex-col gap-4 relative z-10 transition-all ${
              isLight ? "bg-[#f8f8fa] border-zinc-200 shadow-sm" : "bg-[#020203] border-zinc-900"
            }`}>
              
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded border flex items-center justify-center font-mono font-bold text-xs text-orange-500 relative ${
                  isLight ? "bg-white border-zinc-200" : "bg-zinc-950 border-zinc-900"
                }`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 absolute -top-1 -right-1 animate-pulse"></span>
                  01
                </div>
                <h4 className={`text-xs font-mono font-bold uppercase tracking-widest ${isLight ? "text-zinc-800" : "text-zinc-300"}`}>
                  Metadata Fetch
                </h4>
              </div>

              <p className={`text-[11px] font-mono leading-relaxed min-h-[48px] ${isLight ? "text-zinc-650" : "text-zinc-500"}`}>
                Queries the repository file tree structure recursively via remote REST API nodes, bypassing full Git clones.
              </p>

              {/* Console Mockup - Retained as dark for coder readability */}
              <div className="bg-[#0b0b0f] border border-zinc-850 rounded-lg p-3.5 font-mono text-[9px] text-zinc-300 leading-normal overflow-x-auto shadow-inner">
                <div className="text-zinc-500 font-bold uppercase tracking-wider mb-2 border-b border-zinc-800 pb-1.5">// GET /git/trees/main</div>
                <span className="text-zinc-400">[</span>
                <div className="pl-3">
                  <span className="text-zinc-300">{"{"} "path": "package.json", "type": "blob" {"}"},</span><br/>
                  <span className="text-zinc-300">{"{"} "path": "dist/bundle.js", "type": "blob" {"}"}</span>
                </div>
                <span className="text-zinc-400">]</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className={`border rounded-xl p-6 flex flex-col gap-4 relative z-10 transition-all ${
              isLight ? "bg-[#f8f8fa] border-zinc-200 shadow-sm" : "bg-[#020203] border-zinc-900"
            }`}>
              
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded border flex items-center justify-center font-mono font-bold text-xs text-orange-500 relative ${
                  isLight ? "bg-white border-zinc-200" : "bg-zinc-950 border-zinc-900"
                }`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 absolute -top-1 -right-1 animate-pulse"></span>
                  02
                </div>
                <h4 className={`text-xs font-mono font-bold uppercase tracking-widest ${isLight ? "text-zinc-800" : "text-zinc-300"}`}>
                  Noise Filter
                </h4>
              </div>

              <p className={`text-[11px] font-mono leading-relaxed min-h-[48px] ${isLight ? "text-zinc-650" : "text-zinc-500"}`}>
                Excludes node_modules, builds, assets, and lockfiles, leaving only codebase configurations.
              </p>

              {/* Console Mockup */}
              <div className="bg-[#0b0b0f] border border-zinc-850 rounded-lg p-3.5 font-mono text-[9px] text-zinc-300 leading-normal overflow-x-auto shadow-inner">
                <div className="text-zinc-500 font-bold uppercase tracking-wider mb-2 border-b border-zinc-800 pb-1.5">// FILTER EXCLUSIONS</div>
                <span className="text-red-400">- Excluded: "dist/bundle.js"</span><br/>
                <span className="text-emerald-450">+ Target: "package.json"</span><br/>
                <span className="text-zinc-400">Stripped 85% metadata noise.</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className={`border rounded-xl p-6 flex flex-col gap-4 relative z-10 transition-all ${
              isLight ? "bg-[#f8f8fa] border-zinc-200 shadow-sm" : "bg-[#020203] border-zinc-900"
            }`}>
              
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded border flex items-center justify-center font-mono font-bold text-xs text-orange-500 relative ${
                  isLight ? "bg-white border-zinc-200" : "bg-zinc-950 border-zinc-900"
                }`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 absolute -top-1 -right-1 animate-pulse"></span>
                  03
                </div>
                <h4 className={`text-xs font-mono font-bold uppercase tracking-widest ${isLight ? "text-zinc-800" : "text-zinc-300"}`}>
                  LLM Synthesis
                </h4>
              </div>

              <p className={`text-[11px] font-mono leading-relaxed min-h-[48px] ${isLight ? "text-zinc-650" : "text-zinc-500"}`}>
                Gemini 2.5 parses the filtered directory tree and configuration files to build architecture diagrams.
              </p>

              {/* Console Mockup */}
              <div className="bg-[#0b0b0f] border border-zinc-850 rounded-lg p-3.5 font-mono text-[9px] text-zinc-300 leading-normal overflow-x-auto shadow-inner">
                <div className="text-zinc-500 font-bold uppercase tracking-wider mb-2 border-b border-zinc-800 pb-1.5">// GEMINI SYNTHESIS</div>
                <span className="text-zinc-400">{"{"}</span><br/>
                <span className="text-zinc-300 pl-3">"summary": ["React stack", ...],</span><br/>
                <span className="text-zinc-300 pl-3">"mermaid": "flowchart TD..."</span><br/>
                <span className="text-zinc-400">{"}"}</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* PRICING SECTION */}
      <section id="pricing" className={`py-20 px-6 border-t relative transition-colors ${
        isLight ? "border-zinc-200 bg-zinc-50/30" : "border-zinc-900 bg-zinc-955/10"
      }`}>
        
        <div className="max-w-4xl mx-auto flex flex-col gap-12">
          
          <div className="flex flex-col gap-2 items-center text-center">
            <h2 className={`text-xl sm:text-2xl font-black font-mono uppercase tracking-wider transition-colors ${
              isLight ? "text-zinc-800" : "text-zinc-300"
            }`}>
              Pricing Matrices
            </h2>
            <p className={`text-[11px] font-mono transition-colors ${
              isLight ? "text-zinc-500" : "text-zinc-650"
            }`}>
              Deployable on standard free hosting tiers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto mt-4">
            
            {/* Hobby Tier */}
            <div className={`p-6 rounded-xl flex flex-col justify-between relative min-h-[300px] border transition-all ${
              isLight 
                ? "bg-white border-zinc-200 shadow-sm shadow-zinc-200/40" 
                : "bg-zinc-950/20 border-zinc-900"
            }`}>
              <span className={`absolute top-1 left-2 text-[7px] font-mono ${isLight ? "text-zinc-400" : "text-zinc-800"}`}>
                [TIER_01]
              </span>
              
              <div>
                <span className="text-[9px] font-mono text-zinc-500 uppercase font-black tracking-widest">Hobby / Hackathon</span>
                <div className={`text-3xl font-mono font-black mt-2 transition-colors ${isLight ? "text-zinc-850" : "text-zinc-200"}`}>$0</div>
                <ul className="flex flex-col gap-2 mt-6 font-mono text-[10px] text-zinc-500">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-orange-500" />
                    Public Repository Scans
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-orange-500" />
                    15 Scans / Minute
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-orange-500" />
                    Standard Gemini 2.5 Flash
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-orange-500" />
                    Local Browser Storage
                  </li>
                </ul>
              </div>
              
              <a 
                href="/workspace"
                className={`mt-8 w-full font-mono font-bold py-2 rounded-lg text-xs uppercase tracking-wider transition text-center cursor-pointer border ${
                  isLight 
                    ? "bg-zinc-900 hover:bg-black text-white border-zinc-950" 
                    : "bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800"
                }`}
              >
                Launch Workspace
              </a>
            </div>

            {/* Enterprise Tier - Stays dark charcoal to pop as a highlight card */}
            <div className={`p-6 rounded-xl flex flex-col justify-between relative min-h-[300px] border transition-all ${
              isLight 
                ? "bg-zinc-900 border-zinc-950 text-white shadow-md shadow-zinc-300/40" 
                : "bg-[#030305] border-zinc-800 text-white"
            }`}>
              <span className="absolute top-1 left-2 text-[7px] font-mono text-orange-400">[TIER_02]</span>
              
              <div>
                <span className="text-[9px] font-mono text-orange-400 uppercase font-black tracking-widest">Enterprise / Team</span>
                <div className="text-3xl font-mono font-black text-white mt-2">
                  $49<span className="text-xs font-semibold text-zinc-400">/mo</span>
                </div>
                <ul className="flex flex-col gap-2 mt-6 font-mono text-[10px] text-zinc-300">
                  <li className="flex items-center gap-2 text-zinc-300">
                    <Check className="w-3.5 h-3.5 text-orange-500" />
                    Private Repository Integration
                  </li>
                  <li className="flex items-center gap-2 text-zinc-300">
                    <Check className="w-3.5 h-3.5 text-orange-500" />
                    Unlimited High-Speed Scans
                  </li>
                  <li className="flex items-center gap-2 text-zinc-300">
                    <Check className="w-3.5 h-3.5 text-orange-500" />
                    Custom Architectural Rules
                  </li>
                  <li className="flex items-center gap-2 text-zinc-300">
                    <Check className="w-3.5 h-3.5 text-orange-500" />
                    Team Workspaces & Collaborators
                  </li>
                </ul>
              </div>
              
              <button 
                disabled 
                className={`mt-8 w-full font-mono font-bold py-2 rounded-lg text-xs uppercase tracking-wider cursor-not-allowed select-none border ${
                  isLight 
                    ? "bg-zinc-950/40 text-zinc-400 border-zinc-900/40" 
                    : "bg-zinc-950 text-zinc-500 border-zinc-900"
                }`}
              >
                Coming Soon
              </button>
            </div>

          </div>

        </div>
      </section>

      {/* Global Product Footer */}
      <footer className={`border-t py-8 px-6 relative flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left transition-colors duration-300 ${
        isLight ? "border-zinc-200 bg-zinc-50/50" : "border-zinc-900 bg-zinc-955/10"
      }`}>
        <div className={`text-[10px] font-mono select-none ${isLight ? "text-zinc-500" : "text-zinc-500"}`}>
          // REPOMIND AI. DEVELOPED IN 7 HOURS FOR HIGH-SPEED CODE MAPPING.
        </div>
        <div className={`text-[10px] font-mono select-none ${isLight ? "text-zinc-500" : "text-zinc-500"}`}>
          © 2026 REPOMIND. ALL RIGHTS RESERVED.
        </div>
      </footer>
    </div>
  );
}
