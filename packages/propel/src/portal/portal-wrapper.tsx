import React, { useLayoutEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { DEFAULT_PORTAL_ID } from "./constants";
import type { PortalWrapperProps } from "./types";

/**
 * PortalWrapper - A reusable portal component that renders children into a specific DOM element
 * Optimized for SSR compatibility and performance
 *
 * @param children - The content to render inside the portal
 * @param portalId - The ID of the DOM element to render into
 * @param fallbackToDocument - Whether to render directly if portal container is not found
 * @param className - Optional className to apply to the portal container div
 * @param onMount - Callback fired when portal is mounted
 * @param onUnmount - Callback fired when portal is unmounted
 */
export function PortalWrapper({
  children,
  portalId = DEFAULT_PORTAL_ID,
  fallbackToDocument = true,
  className,
  onMount,
  onUnmount,
}: PortalWrapperProps) {
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useLayoutEffect(() => {
    // Ensure we're in browser environment
    if (typeof window === "undefined") return;

    let container = document.getElementById(portalId);

    // Create portal container if it doesn't exist
    if (!container) {
      container = document.createElement("div");
      container.id = portalId;
      container.setAttribute("data-portal", "true");
      document.body.appendChild(container);
    }

    setPortalContainer(container);
    setIsMounted(true);
    onMount?.();

    return () => {
      onUnmount?.();
      // Only remove if we created it and it's empty
      if (container && container.children.length === 0 && container.hasAttribute("data-portal")) {
        document.body.removeChild(container);
      }
    };
  }, [portalId, onMount, onUnmount]);

  const content = useMemo(() => {
    if (!children) return null;
    return className ? <div className={className}>{children}</div> : children;
  }, [children, className]);

  // SSR: render nothing on server
  if (!isMounted) {
    return null;
  }

  // If portal container exists, render into it
  if (portalContainer) {
    return createPortal(content, portalContainer);
  }

  // Fallback behavior for client-side rendering
  if (fallbackToDocument) {
    return content ? (content as React.ReactElement) : null;
  }

  return null;
}
