import {
  shift,
  flip,
  useDismiss,
  useFloating,
  useInteractions,
  autoUpdate,
  useClick,
  useRole,
  FloatingOverlay,
  FloatingPortal,
} from "@floating-ui/react";
import type { Editor } from "@tiptap/core";
import { Ellipsis } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
// plane imports
import { cn } from "@plane/utils";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";
// extensions
import {
  findTable,
  getTableHeightPx,
  getTableWidthPx,
  isCellSelection,
  selectColumn,
} from "@/extensions/table/table/utilities/helpers";
// local imports
import { moveSelectedColumns } from "../actions";
import {
  DROP_MARKER_THICKNESS,
  getColDragMarker,
  getDropMarker,
  hideDragMarker,
  hideDropMarker,
  updateColDragMarker,
  updateColDropMarker,
} from "../marker-utils";
import { updateCellContentVisibility } from "../utils";
import { ColumnOptionsDropdown } from "./dropdown";
import { calculateColumnDropIndex, constructColumnDragPreview, getTableColumnNodesInfo } from "./utils";

export type ColumnDragHandleProps = {
  col: number;
  editor: Editor;
};

export function ColumnDragHandle(props: ColumnDragHandleProps) {
  const { col, editor } = props;
  // states
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  // Track active event listeners for cleanup
  const activeListenersRef = useRef<{
    mouseup?: (e: MouseEvent) => void;
    mousemove?: (e: MouseEvent) => void;
  }>({});

  // Cleanup window event listeners on unmount
  useEffect(() => {
    const listenersRef = activeListenersRef.current;
    return () => {
      // Remove any lingering window event listeners when component unmounts
      if (listenersRef.mouseup) {
        window.removeEventListener("mouseup", listenersRef.mouseup);
      }
      if (listenersRef.mousemove) {
        window.removeEventListener("mousemove", listenersRef.mousemove);
      }
    };
  }, []);
  // floating ui
  const { refs, floatingStyles, context } = useFloating({
    placement: "bottom-start",
    middleware: [
      flip({
        fallbackPlacements: ["top-start", "bottom-start", "top-end", "bottom-end"],
      }),
      shift({
        padding: 8,
      }),
    ],
    open: isDropdownOpen,
    onOpenChange: (open) => {
      setIsDropdownOpen(open);
      if (open) {
        editor.commands.addActiveDropbarExtension(CORE_EXTENSIONS.TABLE);
      } else {
        setTimeout(() => {
          editor.commands.removeActiveDropbarExtension(CORE_EXTENSIONS.TABLE);
        }, 0);
      }
    },
    whileElementsMounted: autoUpdate,
  });
  const click = useClick(context);
  const dismiss = useDismiss(context);
  const role = useRole(context);
  const { getReferenceProps, getFloatingProps } = useInteractions([dismiss, click, role]);

  useEffect(() => {
    if (!isDropdownOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      context.onOpenChange(false);
      event.preventDefault();
      event.stopPropagation();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isDropdownOpen, context]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      e.preventDefault();

      // Prevent multiple simultaneous drag operations
      // If there are already listeners attached, remove them first
      if (activeListenersRef.current.mouseup) {
        window.removeEventListener("mouseup", activeListenersRef.current.mouseup);
      }
      if (activeListenersRef.current.mousemove) {
        window.removeEventListener("mousemove", activeListenersRef.current.mousemove);
      }
      activeListenersRef.current.mouseup = undefined;
      activeListenersRef.current.mousemove = undefined;

      const table = findTable(editor.state.selection);
      if (!table) return;

      editor.view.dispatch(selectColumn(table, col, editor.state.tr));

      // drag column
      const tableWidthPx = getTableWidthPx(table, editor);
      const columns = getTableColumnNodesInfo(table, editor);

      let dropIndex = col;
      const startLeft = columns[col].left ?? 0;
      const startX = e.clientX;
      const tableElement = editor.view.nodeDOM(table.pos);

      const dropMarker = tableElement instanceof HTMLElement ? getDropMarker(tableElement) : null;
      const dragMarker = tableElement instanceof HTMLElement ? getColDragMarker(tableElement) : null;

      const handleFinish = () => {
        if (!dropMarker || !dragMarker) return;
        hideDropMarker(dropMarker);
        hideDragMarker(dragMarker);

        if (isCellSelection(editor.state.selection)) {
          updateCellContentVisibility(editor, false);
        }

        if (col !== dropIndex) {
          let tr = editor.state.tr;
          const selection = editor.state.selection;
          if (isCellSelection(selection)) {
            const table = findTable(selection);
            if (table) {
              tr = moveSelectedColumns(editor, table, selection, dropIndex, tr);
            }
          }
          editor.view.dispatch(tr);
        }
        window.removeEventListener("mouseup", handleFinish);
        window.removeEventListener("mousemove", handleMove);
        // Clear the ref
        activeListenersRef.current.mouseup = undefined;
        activeListenersRef.current.mousemove = undefined;
      };

      let pseudoColumn: HTMLElement | undefined;

      const handleMove = (moveEvent: MouseEvent) => {
        if (!dropMarker || !dragMarker) return;
        const currentLeft = startLeft + moveEvent.clientX - startX;
        dropIndex = calculateColumnDropIndex(col, columns, currentLeft);

        if (!pseudoColumn) {
          pseudoColumn = constructColumnDragPreview(editor, editor.state.selection, table);
          const tableHeightPx = getTableHeightPx(table, editor);
          if (pseudoColumn) {
            pseudoColumn.style.height = `${tableHeightPx}px`;
          }
        }

        const dragMarkerWidthPx = columns[col].width;
        const dragMarkerLeftPx = Math.max(0, Math.min(currentLeft, tableWidthPx - dragMarkerWidthPx));
        const dropMarkerLeftPx =
          dropIndex <= col ? columns[dropIndex].left : columns[dropIndex].left + columns[dropIndex].width;

        updateColDropMarker({
          element: dropMarker,
          left: dropMarkerLeftPx - Math.floor(DROP_MARKER_THICKNESS / 2) - 1,
          width: DROP_MARKER_THICKNESS,
        });
        updateColDragMarker({
          element: dragMarker,
          left: dragMarkerLeftPx,
          width: dragMarkerWidthPx,
          pseudoColumn,
        });
      };

      try {
        // Store references for cleanup
        activeListenersRef.current.mouseup = handleFinish;
        activeListenersRef.current.mousemove = handleMove;
        window.addEventListener("mouseup", handleFinish);
        window.addEventListener("mousemove", handleMove);
      } catch (error) {
        console.error("Error in ColumnDragHandle:", error);
        handleFinish();
      }
    },
    [col, editor]
  );

  return (
    <>
      <div className="table-col-handle-container absolute z-20 top-0 left-0 flex justify-center items-center w-full -translate-y-1/2">
        <button
          ref={refs.setReference}
          {...getReferenceProps()}
          type="button"
          onMouseDown={handleMouseDown}
          className={cn("px-1 bg-layer-1 border border-strong-1 rounded-sm outline-none transition-all duration-200", {
            "!opacity-100 bg-accent-primary border-accent-strong": isDropdownOpen,
            "hover:bg-layer-1-hover": !isDropdownOpen,
          })}
        >
          <Ellipsis className="size-4 text-primary" />
        </button>
      </div>
      {isDropdownOpen && (
        <FloatingPortal>
          {/* Backdrop */}
          <FloatingOverlay
            style={{
              zIndex: 99,
            }}
            lockScroll
          />
          <div
            className="max-h-[90vh] w-[12rem] overflow-y-auto rounded-md border-[0.5px] border-strong bg-surface-1 px-2 py-2.5 shadow-raised-200"
            ref={refs.setFloating}
            {...getFloatingProps()}
            style={{
              ...floatingStyles,
              zIndex: 100,
            }}
          >
            <ColumnOptionsDropdown editor={editor} onClose={() => context.onOpenChange(false)} />
          </div>
        </FloatingPortal>
      )}
    </>
  );
}
