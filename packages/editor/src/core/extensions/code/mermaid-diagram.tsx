/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useRef, useState } from "react";
// plane utils
import { formatMermaidError, getMermaidTheme } from "@plane/utils";

type Props = {
  source: string;
};

// debounce delay (ms) before re-rendering the diagram while the source is being edited
const RENDER_DEBOUNCE_MS = 400;

// mermaid is dynamically imported on the client to keep it out of the initial bundle
let mermaidModulePromise: Promise<typeof import("mermaid").default> | undefined;
const loadMermaid = () => {
  mermaidModulePromise ??= import("mermaid").then((module) => module.default);
  return mermaidModulePromise;
};

let initializedTheme: string | undefined;
let renderIdCounter = 0;

const getThemeAttribute = (element: HTMLElement | null): string | null => {
  const themedAncestor = element?.closest("[data-theme]");
  if (themedAncestor) return themedAncestor.getAttribute("data-theme");
  return document.documentElement.getAttribute("data-theme");
};

export function MermaidDiagram({ source }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  // states
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [themeAttribute, setThemeAttribute] = useState<string | null>(null);

  // track the active `data-theme` (set by next-themes) so the diagram re-renders on theme changes
  useEffect(() => {
    const resolveTheme = () => setThemeAttribute(getThemeAttribute(containerRef.current));
    resolveTheme();
    const observer = new MutationObserver(resolveTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  // render the diagram, debounced, whenever the source or theme changes
  useEffect(() => {
    if (!source.trim()) {
      setError(null);
      setIsLoading(false);
      if (containerRef.current) containerRef.current.innerHTML = "";
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    const renderTimer = setTimeout(() => {
      void (async () => {
        try {
          const mermaid = await loadMermaid();
          if (cancelled) return;

          const theme = getMermaidTheme(themeAttribute);
          if (initializedTheme !== theme) {
            mermaid.initialize({ startOnLoad: false, theme });
            initializedTheme = theme;
          }

          const container = containerRef.current;
          if (!container) return;

          const { svg } = await mermaid.render(`mermaid-diagram-${++renderIdCounter}`, source);
          if (cancelled) return;

          container.innerHTML = svg;
          setError(null);
          setIsLoading(false);
        } catch (err) {
          if (cancelled) return;
          setError(formatMermaidError(err));
          setIsLoading(false);
        }
      })();
    }, RENDER_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(renderTimer);
    };
  }, [source, themeAttribute]);

  if (error) {
    return (
      <div className="mermaid-diagram mermaid-diagram-error" data-mermaid-state="error">
        <p className="mermaid-diagram-error-message">{error}</p>
        <pre className="mermaid-diagram-source">
          <code>{source}</code>
        </pre>
      </div>
    );
  }

  return (
    <div className="mermaid-diagram" data-mermaid-state={isLoading ? "loading" : "rendered"}>
      {isLoading && <div className="mermaid-diagram-loading">Rendering diagram…</div>}
      <div ref={containerRef} className="mermaid-diagram-canvas" />
    </div>
  );
}
