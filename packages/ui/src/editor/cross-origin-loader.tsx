"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";

type CrossOriginLoaderProps = {
  src: string;
  className?: string;
  params?: Record<string, string>;
  onLoaded?: () => void;
  onError?: () => void;
  style?: React.CSSProperties;
};

const CrossOriginLoader = ({
  src,
  className = "",
  params = {},
  onLoaded = () => {},
  onError = () => {},
  style = {},
}: CrossOriginLoaderProps) => {
  // state

  const [hasError, setHasError] = useState(false);
  // ref
  const containerRef = useRef<HTMLDivElement>(null);
  // callback
  const loadContent = useCallback(() => {
    if (!containerRef.current) return;

    // Clear previous content
    containerRef.current.innerHTML = "";

    // Create object element
    const obj = document.createElement("object");
    obj.innerHTML = '<div class="h-[5px]"></div>'; // fallback
    obj.className = "block invisible w-full h-full";
    obj.data = src;

    // // Add parameters

    const isReallyLoaded = (element: HTMLObjectElement) => element.offsetHeight !== 5; // fallback height
    const hasResult = (element: HTMLObjectElement) => element.offsetHeight > 0;

    let loadCheckCompleted = false;

    // Chrome calls always, Firefox on load
    obj.onload = () => {
      if (loadCheckCompleted) return;

      if (isReallyLoaded(obj)) {
        loadCheckCompleted = true;
        obj.className = obj.className.replace("invisible", "visible");
        setHasError(false);
        onLoaded();
      } else {
        loadCheckCompleted = true;
        setHasError(true);
        onError();
      }
    };

    // Firefox on error
    obj.onerror = (e) => {
      if (loadCheckCompleted) return;
      loadCheckCompleted = true;
      setHasError(true);
      onError();
    };

    // Safari workaround
    let intervalCount = 0;
    const interval = setInterval(() => {
      if (loadCheckCompleted) {
        clearInterval(interval);
        return;
      }

      if (hasResult(obj)) {
        if (isReallyLoaded(obj)) {
          intervalCount++;
          // Wait for about 400ms to ensure it's not going to fallback
          if (intervalCount > 4) {
            loadCheckCompleted = true;
            obj.className = obj.className.replace("invisible", "visible");
            setHasError(false);
            onLoaded();
            clearInterval(interval);
          }
        } else {
          loadCheckCompleted = true;
          setHasError(true);
          onError();
          clearInterval(interval);
        }
      }
    }, 100);

    // Cleanup function
    const timeoutId = setTimeout(() => {
      if (!loadCheckCompleted) {
        loadCheckCompleted = true;
        clearInterval(interval);
        setHasError(true);
        onError();
      }
    }, 10000); // 10 second timeout

    containerRef.current.appendChild(obj);

    return () => {
      clearInterval(interval);
      clearTimeout(timeoutId);
    };
  }, [src, onLoaded, onError]);

  useEffect(loadContent, [loadContent]);

  return <div ref={containerRef} className={`w-full h-full ${hasError ? "hidden" : ""} ${className}`} style={style} />;
};
export default CrossOriginLoader;
