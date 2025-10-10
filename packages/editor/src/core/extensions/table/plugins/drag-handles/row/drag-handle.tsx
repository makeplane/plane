import {
  autoUpdate,
  flip,
  FloatingOverlay,
  FloatingPortal,
  shift,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
  useRole,
} from "@floating-ui/react";
import type { Editor } from "@tiptap/core";
import { Ellipsis } from "lucide-react";
import { useCallback, useState } from "react";
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
  selectRow,
} from "@/extensions/table/table/utilities/helpers";
// local imports
import { moveSelectedRows } from "../actions";
import {
  DROP_MARKER_THICKNESS,
  getDropMarker,
  getRowDragMarker,
  hideDragMarker,
  hideDropMarker,
  updateRowDragMarker,
  updateRowDropMarker,
} from "../marker-utils";
import { updateCellContentVisibility } from "../utils";
import { RowOptionsDropdown } from "./dropdown";
import { calculateRowDropIndex, constructRowDragPreview, getTableRowNodesInfo } from "./utils";

export type RowDragHandleProps = {
  editor: Editor;
  row: number;
};

export const RowDragHandle: React.FC<RowDragHandleProps> = (props) => {
  const { editor, row } = props;
  // states
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
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

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      e.preventDefault();

      const table = findTable(editor.state.selection);
      if (!table) return;

      editor.view.dispatch(selectRow(table, row, editor.state.tr));

      // drag row
      const tableHeightPx = getTableHeightPx(table, editor);
      const rows = getTableRowNodesInfo(table, editor);

      let dropIndex = row;
      const startTop = rows[row].top ?? 0;
      const startY = e.clientY;
      const tableElement = editor.view.nodeDOM(table.pos);

      const dropMarker = tableElement instanceof HTMLElement ? getDropMarker(tableElement) : null;
      const dragMarker = tableElement instanceof HTMLElement ? getRowDragMarker(tableElement) : null;

      const handleFinish = (): void => {
        if (!dropMarker || !dragMarker) return;
        hideDropMarker(dropMarker);
        hideDragMarker(dragMarker);

        if (isCellSelection(editor.state.selection)) {
          updateCellContentVisibility(editor, false);
        }

        if (row !== dropIndex) {
          let tr = editor.state.tr;
          const selection = editor.state.selection;
          if (isCellSelection(selection)) {
            const table = findTable(selection);
            if (table) {
              tr = moveSelectedRows(editor, table, selection, dropIndex, tr);
            }
          }
          editor.view.dispatch(tr);
        }
        window.removeEventListener("mouseup", handleFinish);
        window.removeEventListener("mousemove", handleMove);
      };

      let pseudoRow: HTMLElement | undefined;

      const handleMove = (moveEvent: MouseEvent): void => {
        if (!dropMarker || !dragMarker) return;
        const cursorTop = startTop + moveEvent.clientY - startY;
        dropIndex = calculateRowDropIndex(row, rows, cursorTop);

        if (!pseudoRow) {
          pseudoRow = constructRowDragPreview(editor, editor.state.selection, table);
          const tableWidthPx = getTableWidthPx(table, editor);
          if (pseudoRow) {
            pseudoRow.style.width = `${tableWidthPx}px`;
          }
        }

        const dragMarkerHeightPx = rows[row].height;
        const dragMarkerTopPx = Math.max(0, Math.min(cursorTop, tableHeightPx - dragMarkerHeightPx));
        const dropMarkerTopPx = dropIndex <= row ? rows[dropIndex].top : rows[dropIndex].top + rows[dropIndex].height;

        updateRowDropMarker({
          element: dropMarker,
          top: dropMarkerTopPx - DROP_MARKER_THICKNESS / 2,
          height: DROP_MARKER_THICKNESS,
        });
        updateRowDragMarker({
          element: dragMarker,
          top: dragMarkerTopPx,
          height: dragMarkerHeightPx,
          pseudoRow,
        });
      };

      try {
        window.addEventListener("mouseup", handleFinish);
        window.addEventListener("mousemove", handleMove);
      } catch (error) {
        console.error("Error in RowDragHandle:", error);
        handleFinish();
      }
    },
    [editor, row]
  );

  return (
    <>
      <div className="table-row-handle-container absolute z-20 top-0 left-0 flex justify-center items-center h-full -translate-x-1/2">
        <button
          ref={refs.setReference}
          {...getReferenceProps()}
          type="button"
          onMouseDown={handleMouseDown}
          className={cn(
            "py-1 bg-custom-background-90 border border-custom-border-400 rounded outline-none transition-all duration-200",
            {
              "!opacity-100 bg-custom-primary-100 border-custom-primary-100": isDropdownOpen,
              "hover:bg-custom-background-80": !isDropdownOpen,
            }
          )}
        >
          <Ellipsis className="size-4 text-custom-text-100 rotate-90" />
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
            className="max-h-[90vh] w-[12rem] overflow-y-auto rounded-md border-[0.5px] border-custom-border-300 bg-custom-background-100 px-2 py-2.5 shadow-custom-shadow-rg"
            ref={refs.setFloating}
            {...getFloatingProps()}
            style={{
              ...floatingStyles,
              zIndex: 100,
            }}
          >
            <RowOptionsDropdown editor={editor} onClose={() => context.onOpenChange(false)} />
          </div>
        </FloatingPortal>
      )}
    </>
  );
};
