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

export const ColumnDragHandle: React.FC<ColumnDragHandleProps> = (props) => {
  const { col, editor } = props;
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
          className={cn(
            "px-1 bg-custom-background-90 border border-custom-border-400 rounded outline-none transition-all duration-200",
            {
              "!opacity-100 bg-custom-primary-100 border-custom-primary-100": isDropdownOpen,
              "hover:bg-custom-background-80": !isDropdownOpen,
            }
          )}
        >
          <Ellipsis className="size-4 text-custom-text-100" />
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
            <ColumnOptionsDropdown editor={editor} onClose={() => context.onOpenChange(false)} />
          </div>
        </FloatingPortal>
      )}
    </>
  );
};
