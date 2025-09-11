import React, { useState, useRef, useEffect, useCallback } from "react";

type InViewportRendererProps = {
  children: React.ReactNode;
  placeholder?: React.ReactNode;
  threshold?: number;
};

const isScrollable = (node: HTMLElement | SVGElement) => {
  if (!(node instanceof HTMLElement || node instanceof SVGElement)) {
    return false;
  }
  const style = getComputedStyle(node);
  return ["overflow", "overflow-y"].some((propertyName) => {
    const value = style.getPropertyValue(propertyName);
    return value === "auto" || value === "scroll";
  });
};

const scrollParentCache = new WeakMap<HTMLElement | SVGElement, Element | null>();

const getScrollParent = (node: HTMLElement | SVGElement) => {
  if (scrollParentCache.has(node)) {
    return scrollParentCache.get(node);
  }

  let currentParent = node.parentElement;

  while (currentParent) {
    if (isScrollable(currentParent)) {
      scrollParentCache.set(node, currentParent);
      return currentParent;
    }
    currentParent = currentParent.parentElement;
  }

  const result = document.scrollingElement || document.documentElement;
  scrollParentCache.set(node, result);
  return result;
};

export const InViewportRenderer: React.FC<InViewportRendererProps> = ({ children, placeholder, threshold = 0 }) => {
  // states
  const [shouldRender, setShouldRender] = useState(false);
  // refs
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  // dervied
  const isVisible = () => {
    if (!containerRef.current) return false;
    const rect = containerRef.current.getBoundingClientRect();
    return rect.top < window.innerHeight && rect.bottom > 0 && rect.left < window.innerWidth && rect.right > 0;
  };

  // callbacks
  const renderContent = useCallback(() => {
    if (!shouldRender) {
      setShouldRender(true);

      // Clean up observer
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    }
  }, [shouldRender]);

  useEffect(() => {
    if (shouldRender) return;
    if (isVisible()) {
      renderContent();
      return;
    }
    const editorContainer = document.querySelector(".editor-container");
    const root = editorContainer ? getScrollParent(editorContainer as HTMLElement) : null;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          renderContent();
        }
      },
      {
        root,
        threshold,
        rootMargin: `500px 0px 500px 0px`,
      }
    );

    if (containerRef.current) {
      observerRef.current.observe(containerRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [renderContent, shouldRender, threshold]);

  useEffect(() => {
    if (shouldRender) return;

    requestAnimationFrame(() => {
      if (shouldRender) return;
      if (isVisible()) {
        renderContent();
      }
    });
  });

  return <div ref={containerRef}>{shouldRender ? children : placeholder}</div>;
};
