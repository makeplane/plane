import type { Dispatch, ReactElement, SetStateAction } from "react";
import React, { useCallback, useEffect, useState, useRef } from "react";
// helpers
import { usePlatformOS } from "@plane/hooks";
import { cn } from "@plane/utils";

interface ResizableSidebarProps {
  showPeek?: boolean;
  togglePeek: (value?: boolean) => void;
  isCollapsed?: boolean;
  width: number;
  setWidth: Dispatch<SetStateAction<number>>;
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  defaultCollapsed?: boolean;
  peekDuration?: number;
  toggleCollapsed: (value?: boolean) => void;
  onWidthChange?: (width: number) => void;
  onCollapsedChange?: (collapsed: boolean) => void;
  className?: string;
  children?: ReactElement;
  extendedSidebar?: ReactElement;
  isAnyExtendedSidebarExpanded?: boolean;
  isAnySidebarDropdownOpen?: boolean;
}

export function ResizableSidebar({
  showPeek = false,
  togglePeek,
  peekDuration = 500,
  isCollapsed = false,
  toggleCollapsed: toggleCollapsedProp,
  onCollapsedChange,
  width,
  setWidth,
  onWidthChange,
  minWidth = 236,
  maxWidth = 350,
  className = "",
  children,
  extendedSidebar,
  isAnyExtendedSidebarExpanded = false,
  isAnySidebarDropdownOpen = false,
}: ResizableSidebarProps) {
  // states
  const [isResizing, setIsResizing] = useState(false);
  const [isHoveringTrigger, setIsHoveringTrigger] = useState(false);
  // refs
  const peekTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const initialWidthRef = useRef<number>(0);
  const initialMouseXRef = useRef<number>(0);
  // hooks
  const { isMobile } = usePlatformOS();
  // handlers
  const setShowPeek = useCallback(
    (value: boolean) => {
      togglePeek(value);
    },
    [togglePeek]
  );

  const handleResize = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return;

      const deltaX = e.clientX - initialMouseXRef.current;
      const newWidth = Math.min(Math.max(initialWidthRef.current + deltaX, minWidth), maxWidth);
      setWidth(newWidth);
    },
    [isResizing, minWidth, maxWidth, setWidth]
  );

  const startResizing = useCallback(
    (e: React.MouseEvent) => {
      setIsResizing(true);
      initialWidthRef.current = width;
      initialMouseXRef.current = e.clientX;
    },
    [width]
  );

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const toggleCollapsed = useCallback(() => {
    toggleCollapsedProp();
    setShowPeek(false);
    setIsHoveringTrigger(false);
    if (peekTimeoutRef.current) {
      clearTimeout(peekTimeoutRef.current);
    }
  }, [toggleCollapsedProp, setShowPeek]);

  const handlePeekEnter = useCallback(() => {
    if (isCollapsed && showPeek) {
      if (peekTimeoutRef.current) {
        clearTimeout(peekTimeoutRef.current);
      }
    }
  }, [isCollapsed, showPeek]);

  const handlePeekLeave = useCallback(() => {
    if (isCollapsed && !isAnyExtendedSidebarExpanded && !isAnySidebarDropdownOpen) {
      peekTimeoutRef.current = setTimeout(() => {
        setShowPeek(false);
      }, peekDuration);
    }
  }, [isCollapsed, peekDuration, setShowPeek, isAnyExtendedSidebarExpanded, isAnySidebarDropdownOpen]);

  // Set up event listeners for resizing
  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleResize);
      document.addEventListener("mouseup", stopResizing);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleResize);
      document.removeEventListener("mouseup", stopResizing);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, handleResize, stopResizing]);

  // Clean up timeout on unmount
  useEffect(
    () => () => {
      if (peekTimeoutRef.current) {
        clearTimeout(peekTimeoutRef.current);
      }
    },
    []
  );

  useEffect(() => {
    if (!isAnySidebarDropdownOpen && isCollapsed && isHoveringTrigger) {
      handlePeekLeave();
    }
  }, [isAnySidebarDropdownOpen]);

  useEffect(() => {
    if (!isAnyExtendedSidebarExpanded && isCollapsed && isHoveringTrigger) {
      handlePeekLeave();
    }
  }, [isAnyExtendedSidebarExpanded]);

  // Reset peek when sidebar is expanded
  useEffect(() => {
    if (!isCollapsed) {
      setShowPeek(false);
      setIsHoveringTrigger(false);
      if (peekTimeoutRef.current) {
        clearTimeout(peekTimeoutRef.current);
      }
    }
  }, [isCollapsed, setShowPeek]);

  // Call external handlers when state changes
  useEffect(() => {
    onWidthChange?.(width);
  }, [width, onWidthChange]);

  useEffect(() => {
    onCollapsedChange?.(isCollapsed);
  }, [isCollapsed, onCollapsedChange]);

  return (
    <>
      {/* Main Sidebar */}
      <div
        className={cn(
          "h-full z-20 bg-surface-1 border-r border-subtle",
          !isResizing && "transition-all duration-300 ease-in-out",
          isCollapsed ? "translate-x-[-100%] opacity-0 w-0" : "translate-x-0 opacity-100",
          isMobile && "absolute",
          className
        )}
        style={{
          width: `${isCollapsed ? 0 : width}px`,
          minWidth: `${isCollapsed ? 0 : width}px`,
          maxWidth: `${isCollapsed ? 0 : width}px`,
        }}
        role="complementary"
        aria-label="Main sidebar"
      >
        <aside
          className={cn(
            "group/sidebar h-full w-full bg-surface-1 overflow-hidden relative flex flex-col pt-3",
            isAnyExtendedSidebarExpanded && "rounded-none"
          )}
        >
          {children}

          {/* Resize Handle */}
          <div
            className={cn(
              "transition-all duration-200 cursor-ew-resize absolute h-full w-1 z-[20]",
              !isResizing && "hover:bg-surface-2",
              isResizing && "w-1.5 bg-layer-1",
              "top-0 right-0"
            )}
            // onDoubleClick toggle sidebar
            onDoubleClick={() => toggleCollapsed()}
            onMouseDown={(e) => startResizing(e)}
            role="separator"
            aria-label="Resize sidebar"
          />
        </aside>
      </div>
      {/* Peek View */}
      <div
        className={cn(
          "absolute left-0 z-20 bg-surface-1 shadow-sm h-full",
          !isResizing && "transition-all duration-300 ease-in-out",
          isCollapsed && showPeek ? "translate-x-0 opacity-100" : "translate-x-[-100%] opacity-0",
          "pointer-events-none",
          isCollapsed && showPeek && "pointer-events-auto",
          !showPeek ? "w-0" : "w-full"
        )}
        style={{
          width: `${width}px`,
        }}
        onMouseEnter={handlePeekEnter}
        onMouseLeave={handlePeekLeave}
        role="complementary"
        aria-label="Sidebar peek view"
      >
        <aside
          className={cn(
            "group/sidebar h-full w-full bg-surface-1 overflow-hidden relative flex flex-col z-20 pt-4",
            "self-center border-r border-subtle rounded-md rounded-tl-none rounded-bl-none",
            isAnyExtendedSidebarExpanded && "rounded-none"
          )}
        >
          {children}
          {/* Resize Handle */}
          <div
            className={cn(
              "transition-all duration-200 cursor-ew-resize absolute h-full w-1 z-[20]",
              !isResizing && "hover:bg-surface-2",
              isResizing && "bg-layer-1",
              "top-0 right-0"
            )}
            // onDoubleClick toggle sidebar
            onDoubleClick={() => toggleCollapsed()}
            onMouseDown={(e) => startResizing(e)}
            role="separator"
            aria-label="Resize sidebar"
          />
        </aside>
      </div>

      {/* Extended Sidebar */}
      {extendedSidebar && extendedSidebar}
    </>
  );
}
