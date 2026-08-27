/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useEffect, useRef, useState } from "react";

interface IUseKanbanColumnResize {
  minWidth: number;
  maxWidth: number;
  onResizeEnd: (columnId: string, width: number) => void;
}

export const useKanbanColumnResize = ({ minWidth, maxWidth, onResizeEnd }: IUseKanbanColumnResize) => {
  // state
  const [resizingColumnId, setResizingColumnId] = useState<string | null>(null);
  const [currentWidth, setCurrentWidth] = useState<number>(minWidth);
  // refs
  const startXRef = useRef(0);
  const startWidthRef = useRef(minWidth);
  const currentWidthRef = useRef(minWidth);
  const onResizeEndRef = useRef(onResizeEnd);
  onResizeEndRef.current = onResizeEnd;

  const startResize = useCallback((e: React.MouseEvent, columnId: string, startWidth: number) => {
    e.preventDefault();
    e.stopPropagation();
    startXRef.current = e.clientX;
    startWidthRef.current = startWidth;
    currentWidthRef.current = startWidth;
    setCurrentWidth(startWidth);
    setResizingColumnId(columnId);
  }, []);

  useEffect(() => {
    if (!resizingColumnId) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startXRef.current;
      const nextWidth = Math.min(Math.max(startWidthRef.current + deltaX, minWidth), maxWidth);
      currentWidthRef.current = nextWidth;
      setCurrentWidth(nextWidth);
    };

    const handleMouseUp = () => {
      onResizeEndRef.current(resizingColumnId, currentWidthRef.current);
      setResizingColumnId(null);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [resizingColumnId, minWidth, maxWidth]);

  return {
    isResizing: resizingColumnId !== null,
    resizingColumnId,
    currentWidth,
    startResize,
  };
};
