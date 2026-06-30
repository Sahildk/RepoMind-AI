"use client";

import React, { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import { Copy, Download, RefreshCw, AlertTriangle, Check, FileImage, Globe, Maximize2, Minimize2 } from "lucide-react";

interface MermaidRendererProps {
  chart: string;
  theme?: "light" | "dark";
  repoUrl?: string;
  branch?: string;
  isFullscreen?: boolean;
  onFullscreenToggle?: () => void;
}

export default function MermaidRenderer({ 
  chart, 
  theme = "dark",
  repoUrl,
  branch,
  isFullscreen = false,
  onFullscreenToggle
}: MermaidRendererProps) {
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
            htmlLabels: false,
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

  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(chart);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  const handleCopyLink = () => {
    if (!repoUrl) return;
    const shareUrl = `${window.location.origin}${window.location.pathname}?repo=${encodeURIComponent(repoUrl)}&branch=${encodeURIComponent(branch || "")}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
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

  const handleDownloadPng = () => {
    if (!svg) return;
    
    try {
      const svgElement = ref.current?.querySelector("svg");
      if (!svgElement) return;

      // Extract bounding dimensions
      const width = svgElement.viewBox?.baseVal?.width || svgElement.getBoundingClientRect().width || 800;
      const height = svgElement.viewBox?.baseVal?.height || svgElement.getBoundingClientRect().height || 600;

      // Clone element to set explicit dimensions for canvas rendering
      const clonedSvg = svgElement.cloneNode(true) as SVGElement;
      clonedSvg.setAttribute("width", width.toString());
      clonedSvg.setAttribute("height", height.toString());

      // Clean CSS variable font references from the clone styles to avoid canvas tainting
      const styleElements = clonedSvg.querySelectorAll("style");
      styleElements.forEach(style => {
        let css = style.innerHTML;
        css = css.replace(/var\(--font-geist-sans\)/g, "system-ui, -apple-system, sans-serif");
        css = css.replace(/var\(--font-geist-mono\)/g, "monospace");
        style.innerHTML = css;
      });

      const svgString = new XMLSerializer().serializeToString(clonedSvg);
      // Use data-URI format instead of Blob URL for 100% browser compat and sandbox bypass
      const dataUri = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgString);
      
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement("canvas");
        const scale = 2; // high-res crispness
        canvas.width = width * scale;
        canvas.height = height * scale;
        
        const context = canvas.getContext("2d");
        if (context) {
          // Draw solid background based on current theme to ensure text is visible
          context.fillStyle = theme === "light" ? "#f8f8fa" : "#020203";
          context.fillRect(0, 0, canvas.width, canvas.height);
          
          context.imageSmoothingEnabled = true;
          context.imageSmoothingQuality = "high";
          
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          
          try {
            const pngURL = canvas.toDataURL("image/png");
            const downloadLink = document.createElement("a");
            downloadLink.href = pngURL;
            downloadLink.download = "repository-architecture.png";
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
          } catch (err) {
            console.error("Canvas export failed:", err);
          }
        }
      };
      
      image.onerror = (e) => {
        console.error("Image loading failed:", e);
      };

      image.src = dataUri;
    } catch (err) {
      console.error("Failed to download PNG:", err);
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
            className="px-2.5 py-1.5 bg-zinc-900/80 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-lg transition cursor-pointer flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider"
            title="Copy Raw Mermaid Code"
          >
            {isCopied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>Copied Code</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Code</span>
              </>
            )}
          </button>

          {/* Share Link */}
          {repoUrl && (
            <button
              onClick={handleCopyLink}
              className="px-2.5 py-1.5 bg-zinc-900/80 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-lg transition cursor-pointer flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider"
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
          )}

          {/* Download SVG */}
          <button
            onClick={handleDownload}
            className="p-1.5 bg-zinc-900/80 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-lg transition cursor-pointer"
            title="Download SVG Diagram (Vector)"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Download PNG */}
          <button
            onClick={handleDownloadPng}
            className="p-1.5 bg-zinc-900/80 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-lg transition cursor-pointer"
            title="Download PNG Image (Raster)"
          >
            <FileImage className="w-4 h-4" />
          </button>

          {/* Fullscreen Toggle */}
          {onFullscreenToggle && (
            <button
              onClick={onFullscreenToggle}
              className="p-1.5 bg-zinc-900/80 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-lg transition cursor-pointer ml-1"
              title={isFullscreen ? "Close Fullscreen" : "View Fullscreen"}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* SVG Canvas Container */}
      <div ref={ref} className="flex-1 overflow-auto p-6 flex items-center justify-center min-h-[450px] relative select-none">
        <div 
          style={{ transform: `scale(${zoomScale})`, transformOrigin: "center center" }}
          className="transition-transform duration-200 ease-out max-w-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-auto [&>svg]:max-h-[550px] cursor-grab active:cursor-grabbing"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </div>
    </div>
  );
}
