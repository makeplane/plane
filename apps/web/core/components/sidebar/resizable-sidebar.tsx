"use client";

import React, { Dispatch, ReactElement, SetStateAction, useCallback, useEffect, useState, useRef } from "react";
// helpers
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
  disablePeekTrigger?: boolean;
}
// width , setWidth : 受控 的宽度状态。父组件必须提供当前宽度值和更新宽度的函数。
// isCollapsed , toggleCollapsed : 受控 的折叠状态。父组件控制侧边栏是否折叠，并提供切换方法。
// showPeek , togglePeek : 受控 的“窥视”状态。父组件控制“窥视”视图是否显示，并提供切换方法。

// minWidth , maxWidth : 限制侧边栏可拖动的最小和最大宽度。

export function ResizableSidebar({
  showPeek = false, // 受控 的“窥视”状态。父组件控制“窥视”视图是否显示，并提供切换方法。
  togglePeek, // 用于切换“窥视”状态的函数。父组件必须提供此函数，以便在点击“窥视”按钮时切换“窥视”状态。
  peekDuration = 500, // 控制“窥视”视图显示的持续时间。
  isCollapsed = false, // 受控 的折叠状态。父组件控制侧边栏是否折叠，并提供切换方法。
  toggleCollapsed: toggleCollapsedProp, // 用于切换折叠状态的函数。父组件必须提供此函数，以便在点击折叠按钮时切换折叠状态。
  onCollapsedChange, //
  width,  // 受控 的宽度状态。父组件必须提供当前宽度值和更新宽度的函数。
  setWidth, // 用于更新宽度的函数。父组件必须提供此函数，以便在拖动侧边栏时更新宽度。
  onWidthChange, // 用于在宽度变化时触发的回调函数。父组件可以提供此函数，以便在宽度变化时执行自定义逻辑。
  minWidth = 236,  // 限制侧边栏可拖动的最小宽度
  maxWidth = 350,  // 限制侧边栏可拖动的最大宽度
  className = "", // 自定义的 CSS 类名，用于添加自定义样式。
  children, // 侧边栏的子元素。父组件可以在侧边栏中添加自定义内容。
  extendedSidebar, // 侧边栏的扩展内容。父组件可以在侧边栏中添加自定义的扩展内容。
  isAnyExtendedSidebarExpanded = false, // 任何扩展侧边栏是否展开。如果设置为 true ，则侧边栏将显示扩展内容。
  isAnySidebarDropdownOpen = false,   // 任何侧边栏下拉菜单是否打开。如果设置为 true ，则侧边栏将显示下拉菜单。
  disablePeekTrigger = false, // 禁用 “窥视” 触发。如果设置为 true ，则点击 “窥视” 按钮将不会触发 “窥视” 状态的切换。
}: ResizableSidebarProps) {
  // states
  const [isResizing, setIsResizing] = useState(false); //是否正在拖拽调整宽度
  const [isHoveringTrigger, setIsHoveringTrigger] = useState(false);  //鼠标是否在 Peek 触发区悬停
  // refs
  const peekTimeoutRef = useRef<ReturnType<typeof setTimeout>>(); //保存控制 Peek 自动收起的定时器句柄
  const initialWidthRef = useRef<number>(0); // 保存初始宽度，用于计算拖动 deltaX
  const initialMouseXRef = useRef<number>(0); // 保存初始鼠标 X 坐标，用于计算拖动 deltaX

  // handlers
  const setShowPeek = useCallback(
    (value: boolean) => {
      togglePeek(value);
    },
    [togglePeek]
  );
  // 根据当前鼠标位置与初始位置的差值 deltaX，计算新的宽度
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
    // 不给参数就直接取反
    toggleCollapsedProp();
    setShowPeek(false);
    setIsHoveringTrigger(false);
    if (peekTimeoutRef.current) {
      clearTimeout(peekTimeoutRef.current);
    }
  }, [toggleCollapsedProp, setShowPeek]);

  // 悬浮左侧栏
  const handleTriggerEnter = useCallback(() => {
    if (isCollapsed) {
      
      setIsHoveringTrigger(true);
      setShowPeek(true);
      if (peekTimeoutRef.current) {
        clearTimeout(peekTimeoutRef.current);
      }
    }
  }, [isCollapsed, setShowPeek]);

  const handleTriggerLeave = useCallback(() => {
    if (isCollapsed && !isAnyExtendedSidebarExpanded) {
      setIsHoveringTrigger(false);
      peekTimeoutRef.current = setTimeout(() => {
        setShowPeek(false);
      }, peekDuration);
    }
  }, [isCollapsed, peekDuration, setShowPeek, isAnyExtendedSidebarExpanded]);

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
          "h-full z-20 bg-custom-background-100 border-r border-custom-sidebar-border-200",
          !isResizing && "transition-all duration-300 ease-in-out",
          isCollapsed ? "translate-x-[-100%] opacity-0 w-0" : "translate-x-0 opacity-100",
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
            "group/sidebar h-full w-full bg-custom-sidebar-background-100 overflow-hidden relative flex flex-col pt-3",
            isAnyExtendedSidebarExpanded && "rounded-none"
          )}
        >
          {children}

          {/* Resize Handle */}
          <div
            className={cn(
              "transition-all duration-200 cursor-ew-resize absolute h-full w-1 z-[20]",
              !isResizing && "hover:bg-custom-background-90",
              isResizing && "w-1.5 bg-custom-background-80",
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

      {/* Peek Trigger Area */}
      {isCollapsed && !disablePeekTrigger && (
        <div
          className={cn(
            "absolute top-0 left-0 w-1 h-full z-50 bg-transparent",
            "transition-opacity duration-200",
            isHoveringTrigger ? "opacity-100" : "opacity-0"
          )}
          onMouseEnter={handleTriggerEnter}
          onMouseLeave={handleTriggerLeave}
          role="button"
          aria-label="Show sidebar peek"
        />
      )}

      {/* Peek View */}
      <div
        className={cn(
          "absolute left-0 z-20 bg-custom-background-100 shadow-sm h-full",
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
            "group/sidebar h-full w-full bg-custom-sidebar-background-100 overflow-hidden relative flex flex-col z-20 pt-4",
            "self-center border-r border-custom-sidebar-border-200 rounded-md rounded-tl-none rounded-bl-none",
            isAnyExtendedSidebarExpanded && "rounded-none"
          )}
        >
          {children}
          {/* Resize Handle */}
          <div
            className={cn(
              "transition-all duration-200 cursor-ew-resize absolute h-full w-1 z-[20]",
              !isResizing && "hover:bg-custom-background-90",
              isResizing && "bg-custom-background-80",
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
