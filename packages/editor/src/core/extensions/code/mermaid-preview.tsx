/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 */

import { useRef, useEffect, useState, useCallback } from "react";
import ReactDOM from "react-dom";
import { AlertCircle, Check, Code2, Copy, Download, Eye, EyeOff, Maximize, Minus } from "lucide-react";
import { CloseIcon, PlusIcon } from "@plane/propel/icons";
import { Tooltip } from "@plane/propel/tooltip";
import { cn } from "@plane/utils";

// ============================================================================
// Types
// ============================================================================

type MermaidPreviewProps = {
  code: string;
  isCodeVisible?: boolean;
  onToggleCodeVisible?: () => void;
};

type RenderState = "idle" | "loading" | "success" | "error";

type DiagramTheme = "auto" | "dark" | "default";

// ============================================================================
// Constants
// ============================================================================

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
const ZOOM_STEPS = [0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3];
const MIN_PREVIEW_HEIGHT = 120;
const MAX_PREVIEW_HEIGHT = 600;

const DIAGRAM_TYPE_LABELS: Record<string, string> = {
  graph: "Flowchart",
  flowchart: "Flowchart",
  sequencediagram: "Sequence",
  classdiagram: "Class",
  statediagram: "State",
  "statediagram-v2": "State",
  erdiagram: "ER",
  gantt: "Gantt",
  pie: "Pie",
  mindmap: "Mindmap",
  timeline: "Timeline",
  gitgraph: "Git",
  journey: "Journey",
  quadrantchart: "Quadrant",
  sankey: "Sankey",
  xychart: "XY Chart",
  block: "Block",
};

// ============================================================================
// Hooks
// ============================================================================

function getSystemTheme(): "dark" | "default" {
  return document.documentElement.getAttribute("data-theme")?.includes("dark") ? "dark" : "default";
}

function useDocumentTheme(): "dark" | "default" {
  const [theme, setTheme] = useState<"dark" | "default">(() => getSystemTheme());

  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      if (mutations.some((m) => m.attributeName === "data-theme")) {
        const newTheme = getSystemTheme();
        setTheme((prev) => (prev !== newTheme ? newTheme : prev));
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => observer.disconnect();
  }, []);

  return theme;
}

// ============================================================================
// Utilities
// ============================================================================

function getDiagramType(code: string): string | null {
  const lines = code.split("\n");
  for (const rawLine of lines) {
    const line = rawLine.trim().toLowerCase();
    if (!line || line.startsWith("%%")) continue;
    const token = line.split(/[\s\n{]+/)[0];
    return token || null;
  }
  return null;
}

function getDiagramLabel(type: string | null): string | null {
  if (!type) return null;
  return DIAGRAM_TYPE_LABELS[type.toLowerCase()] || null;
}

// Color palettes for auto-coloring nodes (used in classDef injection)
const NODE_COLORS_DARK = [
  { fill: "#1e1e2e", stroke: "#89b4fa", text: "#cdd6f4" }, // Blue
  { fill: "#1e1e2e", stroke: "#cba6f7", text: "#cdd6f4" }, // Mauve
  { fill: "#1e1e2e", stroke: "#f38ba8", text: "#cdd6f4" }, // Red
  { fill: "#1e1e2e", stroke: "#a6e3a1", text: "#cdd6f4" }, // Green
  { fill: "#1e1e2e", stroke: "#fab387", text: "#cdd6f4" }, // Peach
  { fill: "#1e1e2e", stroke: "#94e2d5", text: "#cdd6f4" }, // Teal
  { fill: "#1e1e2e", stroke: "#f9e2af", text: "#cdd6f4" }, // Yellow
  { fill: "#1e1e2e", stroke: "#74c7ec", text: "#cdd6f4" }, // Sapphire
];

const NODE_COLORS_LIGHT = [
  { fill: "#eff1f5", stroke: "#1e66f5", text: "#1e293b" }, // Blue
  { fill: "#eff1f5", stroke: "#8839ef", text: "#1e293b" }, // Mauve
  { fill: "#eff1f5", stroke: "#d20f39", text: "#1e293b" }, // Red
  { fill: "#eff1f5", stroke: "#40a02b", text: "#1e293b" }, // Green
  { fill: "#eff1f5", stroke: "#fe640b", text: "#1e293b" }, // Peach
  { fill: "#eff1f5", stroke: "#179299", text: "#1e293b" }, // Teal
  { fill: "#eff1f5", stroke: "#df8e1d", text: "#1e293b" }, // Yellow
  { fill: "#eff1f5", stroke: "#209fb5", text: "#1e293b" }, // Sapphire
];

/**
 * Extract node IDs from flowchart/graph mermaid code.
 * Handles patterns like: A, A[label], A(label), A{label}, A((label)), A>label], A[[label]], etc.
 */
function extractNodeIds(code: string): string[] {
  const nodeIds = new Set<string>();
  const lines = code.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    // Skip comments, directives, classDef, class, style, and diagram type declarations
    if (
      !trimmed ||
      trimmed.startsWith("%%") ||
      trimmed.startsWith("classDef") ||
      trimmed.startsWith("class ") ||
      trimmed.startsWith("style ") ||
      /^(flowchart|graph|subgraph|end)\b/i.test(trimmed)
    ) {
      continue;
    }

    // Match node definitions - IDs at start of connections or standalone
    // Node ID pattern: word characters, can include underscores
    // Node shapes: [], (), {}, (()), >], [[]], etc.
    const nodePattern = /\b([A-Za-z_][A-Za-z0-9_]*)\s*(?:\[|\(|\{|>|\[\[|\(\()?/g;
    let match;
    while ((match = nodePattern.exec(trimmed)) !== null) {
      const id = match[1];
      // Skip keywords
      if (
        !["subgraph", "end", "direction", "click", "linkStyle", "classDef", "class", "style"].includes(id.toLowerCase())
      ) {
        nodeIds.add(id);
      }
    }
  }

  return Array.from(nodeIds);
}

/**
 * Inject classDef statements and class assignments into mermaid code
 * to automatically colorize nodes with different colors.
 */
function injectNodeColors(code: string, isDark: boolean): string {
  const diagramType = getDiagramType(code);
  // Only apply to flowcharts/graphs
  if (diagramType !== "flowchart" && diagramType !== "graph") {
    return code;
  }

  // Check if user already has classDef statements - don't override
  if (/^\s*classDef\s+/m.test(code)) {
    return code;
  }

  const nodeIds = extractNodeIds(code);
  if (nodeIds.length === 0) {
    return code;
  }

  const colors = isDark ? NODE_COLORS_DARK : NODE_COLORS_LIGHT;

  // Generate classDef statements for each color
  const classDefStatements: string[] = [];
  for (let i = 0; i < colors.length; i++) {
    const { fill, stroke, text } = colors[i];
    classDefStatements.push(`classDef color${i} fill:${fill},stroke:${stroke},stroke-width:2px,color:${text}`);
  }

  // Generate class assignments for each node
  const classAssignments: string[] = [];
  nodeIds.forEach((nodeId, index) => {
    const colorIndex = index % colors.length;
    classAssignments.push(`class ${nodeId} color${colorIndex}`);
  });

  // Append to the end of the code
  return `${code}\n\n${classDefStatements.join("\n")}\n${classAssignments.join("\n")}`;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function svgToPngBlob(svgMarkup: string): Promise<Blob | null> {
  return new Promise((resolve) => {
    const svgBlob = new Blob([svgMarkup], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();

    img.onload = () => {
      const scale = 2;
      const canvas = document.createElement("canvas");
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        resolve(null);
        return;
      }
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(url);
        resolve(blob);
      }, "image/png");
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };

    img.src = url;
  });
}

// ============================================================================
// Fullscreen Modal Component
// ============================================================================

type FullscreenModalProps = {
  svgMarkup: string;
  onClose: () => void;
  diagramLabel: string | null;
  onDownloadSvg: () => void;
  onDownloadPng: () => void;
};

function FullscreenModalWithoutPortal({
  svgMarkup,
  onClose,
  diagramLabel,
  onDownloadSvg,
  onDownloadPng,
}: FullscreenModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const diagramContainerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [initialScale, setInitialScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const dragOffset = useRef({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: 0, y: 0 });

  // Calculate initial scale to fit diagram nicely in viewport
  useEffect(() => {
    const calculateInitialScale = () => {
      if (!diagramContainerRef.current) return;

      const svg = diagramContainerRef.current.querySelector("svg");
      if (!svg) return;

      // Get natural SVG dimensions
      const svgWidth = svg.getAttribute("width")
        ? parseFloat(svg.getAttribute("width")!)
        : svg.getBoundingClientRect().width;
      const svgHeight = svg.getAttribute("height")
        ? parseFloat(svg.getAttribute("height")!)
        : svg.getBoundingClientRect().height;

      if (!svgWidth || !svgHeight) return;

      // Available space (viewport with padding for controls)
      const availableWidth = window.innerWidth * 0.7;
      const availableHeight = window.innerHeight * 0.6;

      // Calculate scale to fit while maintaining aspect ratio (like image modal)
      const scaleX = availableWidth / svgWidth;
      const scaleY = availableHeight / svgHeight;
      const fitScale = Math.min(scaleX, scaleY);

      setInitialScale(fitScale);
      setZoom(1);
      setPosition({ x: 0, y: 0 });
    };

    // Use RAF + timeout for DOM readiness
    let rafId: number;
    let timeoutId: ReturnType<typeof setTimeout>;

    const scheduleCalculation = () => {
      rafId = requestAnimationFrame(() => {
        timeoutId = setTimeout(calculateInitialScale, 50);
      });
    };

    scheduleCalculation();

    window.addEventListener("resize", scheduleCalculation);
    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timeoutId);
      window.removeEventListener("resize", scheduleCalculation);
    };
  }, [svgMarkup]);

  const handleMagnification = useCallback((direction: "increase" | "decrease") => {
    setZoom((prev) => {
      let targetZoom: number;
      if (direction === "increase") {
        targetZoom = ZOOM_STEPS.find((step) => step > prev) ?? MAX_ZOOM;
      } else {
        targetZoom = [...ZOOM_STEPS].reverse().find((step) => step < prev) ?? MIN_ZOOM;
      }
      // Reset position when zooming back to 1x
      if (targetZoom === 1) {
        setPosition({ x: 0, y: 0 });
      }
      return targetZoom;
    });
  }, []);

  // Drag handlers for panning (always enabled)
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      dragStart.current = { x: e.clientX, y: e.clientY };
      dragOffset.current = { x: position.x, y: position.y };
    },
    [position]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      setPosition({ x: dragOffset.current.x + dx, y: dragOffset.current.y + dy });
    },
    [isDragging]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "+" || e.key === "=" || e.key === "-") {
        e.preventDefault();
        e.stopPropagation();
        if (e.key === "Escape") onClose();
        if (e.key === "+" || e.key === "=") handleMagnification("increase");
        if (e.key === "-") handleMagnification("decrease");
      }
    },
    [onClose, handleMagnification]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleKeyDown, handleMouseMove, handleMouseUp]);

  const effectiveZoom = initialScale * zoom;

  return (
    <div
      className={cn(
        "fixed inset-0 size-full z-50 bg-black/90 opacity-100 pointer-events-auto transition-opacity",
        isDragging ? "cursor-grabbing" : "cursor-grab"
      )}
      role="dialog"
      aria-modal="true"
      aria-label="Fullscreen diagram viewer"
    >
      <div
        ref={modalRef}
        onMouseDown={(e) => {
          if (e.target === modalRef.current && !isDragging) onClose();
        }}
        className="relative size-full grid place-items-center overflow-hidden"
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-10 right-10 size-8 grid place-items-center z-10"
          aria-label="Close viewer"
        >
          <CloseIcon className="size-8 text-white/60 hover:text-white transition-colors" />
        </button>

        {/* Diagram type label */}
        {diagramLabel && (
          <div className="absolute top-10 left-10 px-2 py-1 rounded-sm bg-white/10 text-11 text-white/80 font-medium z-10">
            {diagramLabel}
          </div>
        )}

        {/* Diagram container with zoom and pan */}
        <div
          ref={diagramContainerRef}
          className="rounded-lg p-6 bg-layer-1 transition-colors"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${effectiveZoom})`,
            transformOrigin: "center",
            transition: isDragging ? "none" : "transform 0.2s ease",
            maxWidth: "none",
            maxHeight: "none",
          }}
          onMouseDown={handleMouseDown}
          dangerouslySetInnerHTML={{ __html: svgMarkup }}
        />

        {/* Bottom toolbar */}
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 flex items-center justify-center gap-1 rounded-md border border-subtle-1 py-2 divide-x divide-subtle-1 bg-black">
          {/* Zoom controls */}
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => handleMagnification("decrease")}
              className="size-6 grid place-items-center text-white/60 hover:text-white disabled:text-white/30 transition-colors duration-200"
              disabled={zoom <= MIN_ZOOM}
              aria-label="Zoom out"
            >
              <Minus className="size-4" />
            </button>
            <span className="text-13 w-12 text-center text-white">{Math.round(100 * zoom)}%</span>
            <button
              type="button"
              onClick={() => handleMagnification("increase")}
              className="size-6 grid place-items-center text-white/60 hover:text-white disabled:text-white/30 transition-colors duration-200"
              disabled={zoom >= MAX_ZOOM}
              aria-label="Zoom in"
            >
              <PlusIcon className="size-4" />
            </button>
          </div>
          {/* Download SVG */}
          <button
            type="button"
            onClick={onDownloadSvg}
            className="flex-shrink-0 size-8 grid place-items-center text-white/60 hover:text-white transition-colors duration-200"
            aria-label="Download SVG"
          >
            <Download className="size-4" />
          </button>
          {/* Download PNG */}
          <button
            type="button"
            onClick={onDownloadPng}
            className="flex-shrink-0 px-3 h-6 grid place-items-center text-white/60 hover:text-white transition-colors duration-200 text-11"
            aria-label="Download PNG"
          >
            PNG
          </button>
        </div>
      </div>
    </div>
  );
}

function FullscreenModal(props: FullscreenModalProps) {
  const portal = document.querySelector("#editor-portal");
  const modal = <FullscreenModalWithoutPortal {...props} />;

  if (portal) {
    return ReactDOM.createPortal(modal, portal);
  }
  if (typeof document !== "undefined" && document.body) {
    return ReactDOM.createPortal(modal, document.body);
  }
  return modal;
}

// ============================================================================
// Main Component
// ============================================================================

export function MermaidPreview({ code, isCodeVisible, onToggleCodeVisible }: MermaidPreviewProps) {
  const themeDropdownRef = useRef<HTMLDivElement>(null);
  const diagramContainerRef = useRef<HTMLDivElement>(null);
  const [renderState, setRenderState] = useState<RenderState>("idle");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [svgMarkup, setSvgMarkup] = useState("");
  const [copiedState, setCopiedState] = useState<"none" | "svg" | "code">("none");
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const [localTheme, setLocalTheme] = useState<DiagramTheme>("auto");
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [contentHeight, setContentHeight] = useState<number | null>(null);

  const systemTheme = useDocumentTheme();

  // Derived values - computed inline, not stored in refs
  const trimmedCode = code.trim();
  const effectiveTheme = localTheme === "auto" ? systemTheme : localTheme;
  const diagramType = getDiagramType(trimmedCode);
  const diagramLabel = getDiagramLabel(diagramType);

  // Close theme dropdown on outside click
  useEffect(() => {
    if (!isThemeOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (themeDropdownRef.current && !themeDropdownRef.current.contains(e.target as Node)) {
        setIsThemeOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isThemeOpen]);

  // Single effect for Mermaid rendering - follows react.dev patterns
  useEffect(() => {
    if (!trimmedCode) {
      setRenderState("idle");
      setErrorMessage("");
      setSvgMarkup("");
      return;
    }

    let cancelled = false;

    async function renderDiagram() {
      setRenderState("loading");
      setErrorMessage("");

      try {
        const mermaid = await import("mermaid").then((m) => m.default);
        if (cancelled) return;

        mermaid.initialize({
          startOnLoad: false,
          theme: "base",
          securityLevel: "loose",
          fontFamily: "inherit",
          themeVariables:
            effectiveTheme === "dark"
              ? {
                  darkMode: true,
                  background: "#1e1e2e",
                  primaryColor: "#1e1e2e",
                  primaryTextColor: "#cdd6f4",
                  primaryBorderColor: "#89b4fa",
                  secondaryColor: "#313244",
                  secondaryTextColor: "#cdd6f4",
                  secondaryBorderColor: "#cba6f7",
                  tertiaryColor: "#45475a",
                  tertiaryTextColor: "#cdd6f4",
                  tertiaryBorderColor: "#f38ba8",
                  lineColor: "#6c7086",
                  textColor: "#cdd6f4",
                  mainBkg: "#1e1e2e",
                  nodeBorder: "#89b4fa",
                  clusterBkg: "#313244",
                  clusterBorder: "#6c7086",
                  titleColor: "#cdd6f4",
                  edgeLabelBackground: "#313244",
                  nodeTextColor: "#cdd6f4",
                  // Mindmap colors - deep, saturated colors like Notion
                  cScale0: "#2d3748", // Charcoal gray
                  cScale1: "#553c9a", // Deep purple
                  cScale2: "#285e61", // Deep teal
                  cScale3: "#9b2c2c", // Deep red
                  cScale4: "#276749", // Deep green
                  cScale5: "#c05621", // Deep orange
                  cScale6: "#975a16", // Deep amber
                  cScale7: "#2b6cb0", // Deep blue
                  cScale8: "#6b46c1", // Violet
                  cScale9: "#97266d", // Deep pink
                  cScale10: "#2c5282", // Navy
                  cScale11: "#744210", // Brown
                  // Text colors - light for dark backgrounds
                  cScaleLabel0: "#e2e8f0",
                  cScaleLabel1: "#e9d8fd",
                  cScaleLabel2: "#b2f5ea",
                  cScaleLabel3: "#fed7d7",
                  cScaleLabel4: "#c6f6d5",
                  cScaleLabel5: "#feebc8",
                  cScaleLabel6: "#fefcbf",
                  cScaleLabel7: "#bee3f8",
                  cScaleLabel8: "#e9d8fd",
                  cScaleLabel9: "#fed7e2",
                  cScaleLabel10: "#bee3f8",
                  cScaleLabel11: "#feebc8",
                }
              : {
                  darkMode: false,
                  background: "#ffffff",
                  primaryColor: "#e0e7ff",
                  primaryTextColor: "#1e293b",
                  primaryBorderColor: "#6366f1",
                  secondaryColor: "#fce7f3",
                  secondaryTextColor: "#1e293b",
                  secondaryBorderColor: "#ec4899",
                  tertiaryColor: "#ecfccb",
                  tertiaryTextColor: "#1e293b",
                  tertiaryBorderColor: "#84cc16",
                  lineColor: "#64748b",
                  textColor: "#1e293b",
                  mainBkg: "#e0e7ff",
                  nodeBorder: "#6366f1",
                  clusterBkg: "#f1f5f9",
                  clusterBorder: "#94a3b8",
                  titleColor: "#1e293b",
                  edgeLabelBackground: "#f8fafc",
                  nodeTextColor: "#1e293b",
                  // Mindmap colors for light theme
                  cScale0: "#1e66f5", // Blue
                  cScale1: "#8839ef", // Mauve/Purple
                  cScale2: "#179299", // Teal
                  cScale3: "#d20f39", // Red
                  cScale4: "#40a02b", // Green
                  cScale5: "#fe640b", // Peach/Orange
                  cScale6: "#df8e1d", // Yellow
                  cScale7: "#209fb5", // Sapphire
                  cScale8: "#7287fd", // Lavender
                  cScale9: "#e64553", // Maroon
                  cScale10: "#04a5e5", // Sky
                  cScale11: "#ea76cb", // Pink
                  // Corresponding label colors for mindmap
                  cScaleLabel0: "#ffffff",
                  cScaleLabel1: "#ffffff",
                  cScaleLabel2: "#ffffff",
                  cScaleLabel3: "#ffffff",
                  cScaleLabel4: "#ffffff",
                  cScaleLabel5: "#ffffff",
                  cScaleLabel6: "#ffffff",
                  cScaleLabel7: "#ffffff",
                  cScaleLabel8: "#ffffff",
                  cScaleLabel9: "#ffffff",
                  cScaleLabel10: "#ffffff",
                  cScaleLabel11: "#ffffff",
                },
        });

        // Inject classDef statements to auto-colorize nodes for flowcharts
        const colorizedCode = injectNodeColors(trimmedCode, effectiveTheme === "dark");

        const elementId = `mermaid-${Date.now()}`;
        const { svg } = await mermaid.render(elementId, colorizedCode);

        if (cancelled) return;

        setSvgMarkup(svg);
        setPan({ x: 0, y: 0 });
        setZoom(1);
        setContentHeight(null); // Reset to measure new content
        setRenderState("success");
      } catch (err) {
        if (cancelled) return;
        setRenderState("error");
        setSvgMarkup("");
        setErrorMessage(err instanceof Error ? err.message : "Invalid Mermaid syntax");
      }
    }

    // Debounce rendering for performance
    const timeoutId = setTimeout(renderDiagram, 300);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [trimmedCode, effectiveTheme]);

  // Measure SVG content and set appropriate container height
  useEffect(() => {
    if (renderState !== "success" || !diagramContainerRef.current || contentHeight !== null) return;

    const svg = diagramContainerRef.current.querySelector("svg");
    if (!svg) return;

    // Get the natural height of the SVG
    const svgHeight = svg.getBoundingClientRect().height;
    // Add padding (32px total for p-4 on container)
    const totalHeight = svgHeight + 32;
    // Clamp between min and max
    const clampedHeight = Math.max(MIN_PREVIEW_HEIGHT, Math.min(MAX_PREVIEW_HEIGHT, totalHeight));
    setContentHeight(clampedHeight);
  }, [renderState, svgMarkup, contentHeight]);

  // Actions
  const handleCopySvg = useCallback(async () => {
    if (!svgMarkup) return;
    await navigator.clipboard.writeText(svgMarkup);
    setCopiedState("svg");
    setTimeout(() => setCopiedState("none"), 1500);
  }, [svgMarkup]);

  const handleCopyCode = useCallback(async () => {
    await navigator.clipboard.writeText(code);
    setCopiedState("code");
    setTimeout(() => setCopiedState("none"), 1500);
  }, [code]);

  const handleDownloadSvg = useCallback(() => {
    if (!svgMarkup) return;
    const blob = new Blob([svgMarkup], { type: "image/svg+xml;charset=utf-8" });
    downloadBlob(blob, `diagram${diagramLabel ? `-${diagramLabel.toLowerCase()}` : ""}.svg`);
  }, [svgMarkup, diagramLabel]);

  const handleDownloadPng = useCallback(async () => {
    if (!svgMarkup) return;
    const blob = await svgToPngBlob(svgMarkup);
    if (blob) {
      downloadBlob(blob, `diagram${diagramLabel ? `-${diagramLabel.toLowerCase()}` : ""}.png`);
    }
  }, [svgMarkup, diagramLabel]);

  const handleZoom = useCallback((direction: "in" | "out" | "reset") => {
    setZoom((prev) => {
      if (direction === "reset") {
        setPan({ x: 0, y: 0 });
        return 1;
      }
      if (direction === "in") return Math.min(MAX_ZOOM, prev + 0.25);
      return Math.max(MIN_ZOOM, prev - 0.25);
    });
  }, []);

  const handlePanStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsPanning(true);
      panStartRef.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
    },
    [pan]
  );

  const handlePanMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isPanning) return;
      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;
      setPan({ x: panStartRef.current.panX + dx, y: panStartRef.current.panY + dy });
    },
    [isPanning]
  );

  const handlePanEnd = useCallback(() => {
    setIsPanning(false);
  }, []);

  return (
    <>
      <div className="mermaid-preview-container relative border-t border-subtle bg-layer-1 rounded-b-lg">
        {/* Floating toolbar - appears on hover */}
        <div
          className={cn(
            "absolute top-2 right-2 z-20 bg-black/80 rounded-sm flex items-center gap-1 h-7 px-2",
            "opacity-0 pointer-events-none transition-opacity",
            renderState === "success" && "group-hover/code:opacity-100 group-hover/code:pointer-events-auto"
          )}
        >
          {/* Code toggle */}
          {onToggleCodeVisible && (
            <Tooltip tooltipContent={isCodeVisible ? "Hide code" : "Show code"}>
              <button
                type="button"
                onClick={onToggleCodeVisible}
                className="h-full flex items-center gap-1 px-1 text-white/60 hover:text-white transition-colors"
              >
                {isCodeVisible ? <Eye className="size-3" /> : <EyeOff className="size-3" />}
              </button>
            </Tooltip>
          )}

          {/* Theme selector */}
          <div ref={themeDropdownRef} className="relative h-full">
            <Tooltip tooltipContent="Theme">
              <button
                type="button"
                onClick={() => setIsThemeOpen(!isThemeOpen)}
                className="h-full flex items-center gap-1 px-1 text-white/60 hover:text-white transition-colors text-11"
              >
                {localTheme === "auto" ? "Auto" : localTheme === "default" ? "Light" : "Dark"}
              </button>
            </Tooltip>
            {isThemeOpen && (
              <div className="absolute top-full right-0 mt-0.5 bg-black/80 rounded-sm overflow-hidden min-w-[60px]">
                {(["auto", "default", "dark"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setLocalTheme(t);
                      setIsThemeOpen(false);
                    }}
                    className={cn(
                      "w-full px-2 py-1 text-left text-11 transition-colors",
                      localTheme === t ? "text-white bg-white/10" : "text-white/60 hover:text-white hover:bg-white/5"
                    )}
                  >
                    {t === "auto" ? "Auto" : t === "default" ? "Light" : "Dark"}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="w-px h-4 bg-white/20" />

          {/* Copy code */}
          <Tooltip tooltipContent={copiedState === "code" ? "Copied!" : "Copy code"}>
            <button
              type="button"
              onClick={handleCopyCode}
              className="h-full flex items-center px-1 text-white/60 hover:text-white transition-colors"
            >
              {copiedState === "code" ? <Check className="size-3" /> : <Copy className="size-3" />}
            </button>
          </Tooltip>

          {/* Download */}
          <Tooltip tooltipContent="Download SVG">
            <button
              type="button"
              onClick={handleDownloadSvg}
              className="h-full flex items-center px-1 text-white/60 hover:text-white transition-colors"
            >
              <Download className="size-3" />
            </button>
          </Tooltip>

          {/* Fullscreen */}
          <Tooltip tooltipContent="Fullscreen">
            <button
              type="button"
              onClick={() => setIsFullscreen(true)}
              className="h-full flex items-center px-1 text-white/60 hover:text-white transition-colors"
            >
              <Maximize className="size-3" />
            </button>
          </Tooltip>
        </div>

        {/* Content area */}
        <div className="min-h-[120px]">
          {/* Idle state */}
          {renderState === "idle" && (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Code2 className="size-8 text-placeholder mb-2" />
              <p className="text-13 text-secondary">No diagram to preview</p>
              <p className="text-11 text-placeholder mt-1">Start typing Mermaid syntax to see a live preview</p>
            </div>
          )}

          {/* Loading state */}
          {renderState === "loading" && (
            <div className="flex flex-col items-center justify-center py-10">
              <div className="relative size-6 mb-2">
                <div className="absolute inset-0 rounded-full border-2 border-layer-3" />
                <div className="absolute inset-0 rounded-full border-2 border-accent-primary border-t-transparent animate-spin" />
              </div>
              <p className="text-11 text-secondary">Rendering...</p>
            </div>
          )}

          {/* Error state */}
          {renderState === "error" && (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
              <div className="size-8 rounded-full bg-danger-subtle grid place-items-center mb-2">
                <AlertCircle className="size-4 text-danger-primary" />
              </div>
              <p className="text-13 text-danger-primary font-medium">Syntax error</p>
              {errorMessage && (
                <div className="mt-2 max-w-md p-2 rounded-sm bg-danger-subtle/30 border border-danger-subtle">
                  <code className="text-11 text-danger-primary break-all whitespace-pre-wrap">{errorMessage}</code>
                </div>
              )}
            </div>
          )}

          {/* Success state */}
          {renderState === "success" && (
            <div className="p-4">
              {/* Diagram type badge */}
              {diagramLabel && (
                <div className="mb-2">
                  <span className="inline-block px-1.5 py-0.5 rounded-sm bg-layer-2 text-11 text-tertiary font-medium">
                    {diagramLabel}
                  </span>
                </div>
              )}

              {/* Diagram with zoom and pan */}
              <div
                ref={diagramContainerRef}
                className={cn(
                  "overflow-auto cursor-grab transition-[height] duration-200",
                  isPanning && "cursor-grabbing"
                )}
                style={{
                  height: contentHeight ? `${contentHeight}px` : "auto",
                  maxHeight: `${MAX_PREVIEW_HEIGHT}px`,
                  minHeight: `${MIN_PREVIEW_HEIGHT}px`,
                }}
                onMouseDown={handlePanStart}
                onMouseMove={handlePanMove}
                onMouseUp={handlePanEnd}
                onMouseLeave={handlePanEnd}
              >
                <div
                  className={cn("flex justify-center", !isPanning && "transition-transform duration-150")}
                  style={{
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                    transformOrigin: "top center",
                  }}
                  dangerouslySetInnerHTML={{ __html: svgMarkup }}
                />
              </div>

              {/* Bottom controls - Zoom only */}
              <div className="flex items-center justify-center mt-3 pt-3 border-t border-subtle">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleZoom("out")}
                    disabled={zoom <= MIN_ZOOM}
                    className="size-6 grid place-items-center rounded-sm text-tertiary hover:text-primary hover:bg-layer-2 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                  >
                    <Minus className="size-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleZoom("reset")}
                    className="w-10 text-center text-11 text-tertiary hover:text-primary transition-colors"
                  >
                    {Math.round(zoom * 100)}%
                  </button>
                  <button
                    type="button"
                    onClick={() => handleZoom("in")}
                    disabled={zoom >= MAX_ZOOM}
                    className="size-6 grid place-items-center rounded-sm text-tertiary hover:text-primary hover:bg-layer-2 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                  >
                    <PlusIcon className="size-3" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen modal */}
      {isFullscreen && svgMarkup && (
        <FullscreenModal
          svgMarkup={svgMarkup}
          onClose={() => setIsFullscreen(false)}
          diagramLabel={diagramLabel}
          onDownloadSvg={handleDownloadSvg}
          onDownloadPng={handleDownloadPng}
        />
      )}
    </>
  );
}
