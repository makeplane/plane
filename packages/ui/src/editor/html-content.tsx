import React, { useEffect, useRef, useState } from "react";
import { Loader } from "../loader";
import { cn } from "../utils";

type HTMLContentProps = {
  html: string;
  showLoading?: boolean;
};

// User for Directly rendering content we got from iframely
const HTMLContentComponent = ({ html, showLoading = true }: HTMLContentProps) => {
  // state
  const [contentReady, setContentReady] = useState(!showLoading);
  // ref
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // If showLoading is false, content is ready immediately
    if (!showLoading) {
      setContentReady(true);
      const container = containerRef.current;
      if (container) {
        container.innerHTML = html;
      }
      return;
    }

    // Reset state when HTML changes
    setContentReady(false);

    // Access the container after rendering
    const container = containerRef.current;
    if (!container) return;

    // Set the HTML content
    container.innerHTML = html;

    // Find iframes
    const iframes = container.querySelectorAll("iframe");

    // If no iframes, content is ready immediately
    if (iframes.length === 0) {
      setContentReady(true);
      return;
    }

    let loadedIframeCount = 0;
    iframes.forEach((iframe) => {
      iframe.addEventListener("load", () => {
        loadedIframeCount++;

        if (loadedIframeCount === iframes.length) {
          if (container.offsetHeight > 100) {
            setContentReady(true);
          }
        }
      });
    });
  }, [html, showLoading]);

  return (
    <div className="my-4 relative w-full">
      {!contentReady && (
        <div className="absolute inset-0 flex justify-center items-center">
          <Loader className="w-full h-full">
            <Loader.Item width="100%" height="100%" />
          </Loader>
        </div>
      )}
      <div
        ref={containerRef}
        className={cn(
          "transition-all duration-300 bg-custom-background-50 border border-custom-border-200 rounded-lg overflow-hidden",
          contentReady ? "animate-fade-in opacity-100" : "opacity-0 translate-y-5"
        )}
      />
    </div>
  );
};

export const HTMLContent = React.memo(HTMLContentComponent);
HTMLContent.displayName = "HTMLContent";
