"use client";

import React, { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import { Copy, Download, RefreshCw, AlertTriangle, Check } from "lucide-react";

interface MermaidRendererProps {
  chart: string;
  theme?: "light" | "dark";
}

export default function MermaidRenderer({ chart, theme = "dark" }: MermaidRendererProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);

  useEffect(() => {
    if (!chart) return;
    setError(null);
    setSvg("");

    const uniqueId = `mermaid-${Math.floor(Math.random() * 100000)}`;

    const renderChart = async () => {
      try {
        // Dynamically initialize Mermaid based on the current active UI theme variables
        mermaid.initialize({
          startOnLoad: false,
          theme: theme === "light" ? "default" : "dark",
          securityLevel: "strict",
          flowchart: {
            useMaxWidth: true,
            htmlLabels: true,
            curve: "basis",
          },
          themeVariables: theme === "light" ? {
            primaryColor: "#f4f4f5", // Light zinc background
            primaryTextColor: "#18181b", // Dark text
            primaryBorderColor: "#ea580c", // Orange borders
            lineColor: "#ea580c", // Orange connecting lines
            secondaryColor: "#e4e4e7",
            tertiaryColor: "#f4f4f5",
          } : {
            primaryColor: "#18181b", // Dark zinc background
            primaryTextColor: "#f4f4f5", // Light text
            primaryBorderColor: "#ea580c", // Orange borders
            lineColor: "#ea580c", // Orange connecting lines
            secondaryColor: "#09090b",
            tertiaryColor: "#020203",
          }
        });

        // Clear any previous error logs from mermaid's internal cache
        const { svg: renderedSvg } = await mermaid.render(uniqueId, chart);
        setSvg(renderedSvg);
      } catch (err: any) {
        console.error("Mermaid Render Error:", err);
        // Clear bad element from body if left by mermaid render failure
        const badElement = document.getElementById(uniqueId);
        if (badElement) badElement.remove();
        
        setError(
          err.message || 
          "Failed to render the diagram. There might be a syntax error in the generated Mermaid string."
        );
      }
    };

    renderChart();
  }, [chart, theme]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(chart);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  const handleDownload = () => {
    if (!svg) return;
    
    try {
      const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `repository-architecture.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download SVG:", err);
    }
  };

  const handleZoomIn = () => setZoomScale(prev => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setZoomScale(prev => Math.max(prev - 0.1, 0.5));
  const handleZoomReset = () => setZoomScale(1);

  if (error) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-6 bg-zinc-950/40 backdrop-blur-md rounded-2xl border border-red-500/20 text-center">
        <div className="p-3 bg-red-500/10 rounded-full text-red-500 mb-4 animate-bounce">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-semibold text-zinc-100 mb-2">Mermaid Render Failed</h3>
        <p className="text-sm text-zinc-400 max-w-md mb-4 leading-relaxed">
          The LLM generated an invalid Mermaid flowchart string. You can view the raw code below or try running the analyzer again.
        </p>
        <div className="w-full max-h-48 overflow-y-auto bg-zinc-900/80 border border-zinc-800 text-left p-3 rounded-lg font-mono text-xs text-red-400 mb-4 whitespace-pre-wrap">
          {error}
        </div>
        
        <div className="w-full text-left">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Generated Raw Mermaid Code:</p>
          <pre className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-800 text-zinc-400 font-mono text-xs overflow-x-auto max-h-40 whitespace-pre">
            {chart}
          </pre>
        </div>
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="flex flex-col h-full items-center justify-center py-20 text-zinc-500">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-500 mb-4" />
        <p className="text-sm font-medium animate-pulse text-zinc-400">Rendering visual map...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-zinc-950/20 rounded-2xl border border-zinc-800/80 overflow-hidden backdrop-blur-md">
      {/* Header controls */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 px-4 py-3 bg-zinc-900/30">
        <div className="flex items-center gap-1.5 bg-zinc-900/80 border border-zinc-800 px-2.5 py-1 rounded-lg text-xs font-mono text-zinc-400 select-none">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Mermaid Rendered
        </div>
        
        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center bg-zinc-900/80 border border-zinc-800 rounded-lg p-0.5">
            <button 
              onClick={handleZoomOut}
              className="px-2 py-1 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded text-xs font-semibold transition"
              title="Zoom Out"
            >
              -
            </button>
            <button 
              onClick={handleZoomReset}
              className="px-2 py-1 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded text-xs font-medium transition"
              title="Reset Zoom"
            >
              {Math.round(zoomScale * 100)}%
            </button>
            <button 
              onClick={handleZoomIn}
              className="px-2 py-1 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded text-xs font-semibold transition"
              title="Zoom In"
            >
              +
            </button>
          </div>

          {/* Copy Raw Code */}
          <button
            onClick={handleCopy}
            className="p-1.5 bg-zinc-900/80 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-lg transition"
            title="Copy Raw Mermaid Code"
          >
            {isCopied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          </button>

          {/* Download SVG */}
          <button
            onClick={handleDownload}
            className="p-1.5 bg-zinc-900/80 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-lg transition"
            title="Download SVG Diagram"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* SVG Canvas Container */}
      <div className="flex-1 overflow-auto p-6 flex items-center justify-center min-h-[450px] relative select-none">
        <div 
          style={{ transform: `scale(${zoomScale})`, transformOrigin: "center center" }}
          className="transition-transform duration-200 ease-out max-w-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-auto [&>svg]:max-h-[550px] cursor-grab active:cursor-grabbing"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </div>
    </div>
  );
}
