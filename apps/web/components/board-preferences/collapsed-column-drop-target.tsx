/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/**
 * Drop zones for collapsed kanban groups.
 *
 * A collapsed kanban column renders only its expand button, and a collapsed swimlane (sub-group row) only
 * its title strip, so neither has the drop targets of an expanded group. These zones give them one.
 *
 * - CollapsedColumnDropZone wraps the whole collapsed column of the flat board, which fills the board's
 *   height (it is a stretched flex item of the board row). It carries the same COLUMN data as an expanded
 *   column, so the drop runs through the normal handleOnDrop.
 * - CollapsedRowDropZone is the whole collapsed swimlane: the title strip across the board's full width.
 *   A card dropped there keeps its column and moves to that row.
 *
 * While a work item is dragged over a zone, the group previews as expanded with a ghost of the card
 * where it would land (drop-preview.tsx). The preview is local state and never stored.
 *
 * After a drop, onDropped opens the group through expandGroup, never the collapse toggle: the
 * drop has already put the ticket in the store by then, so a toggle would see a non-empty group and
 * collapse it again. A drop the workflow refuses shows the warning toast and the group collapses back.
 * The zones work with auto-collapse on and for groups collapsed by hand with it off.
 */

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
// plane imports
import { useTranslation } from "@plane/i18n";
import { setToast } from "@plane/blocks/toast";
import { Row } from "@plane/blocks/layout";
import { cn } from "@plane/utils";
// components
import type { GroupDropLocation } from "@/components/issues/issue-layouts/utils";
import { getDestinationFromDropPayload, getSourceFromDropPayload } from "@/components/issues/issue-layouts/utils";
// local imports
import { DropGhost, getDropPreview, isWorkItemDrag, useDropPreview } from "./drop-preview";

type ColumnProps = {
  groupId: string;
  subGroupId: string;
  /** items in the column (a column collapsed by hand can hold some); shown as a hint in the preview */
  count: number;
  isDropDisabled?: boolean;
  dropErrorMessage?: string;
  handleOnDrop: (source: GroupDropLocation, destination: GroupDropLocation) => Promise<void>;
  /** called after a drop, to expand the column */
  onDropped: () => void;
  /** the header of the column shown as expanded while a work item hovers it */
  renderPreviewHeader: () => ReactNode;
  /** the collapsed column itself, shown when nothing hovers it */
  children: ReactNode;
};

export function CollapsedColumnDropZone(props: ColumnProps) {
  const { groupId, subGroupId, count, isDropDisabled, dropErrorMessage, handleOnDrop, onDropped } = props;
  const { renderPreviewHeader, children } = props;
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement | null>(null);
  const { preview, enter, leave, end } = useDropPreview();
  // per-render values for the drop handler, so the target registers once per group (not on every render)
  const latest = useRef({ isDropDisabled, dropErrorMessage, handleOnDrop, onDropped });
  latest.current = { isDropDisabled, dropErrorMessage, handleOnDrop, onDropped };

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    return dropTargetForElements({
      element,
      canDrop: isWorkItemDrag,
      getData: () => ({ groupId, subGroupId, columnId: `${groupId}__${subGroupId}`, type: "COLUMN" }),
      onDragEnter: ({ source }) => enter(getDropPreview(source.element)),
      onDragLeave: () => leave(),
      onDrop: (payload) => {
        end();
        const source = getSourceFromDropPayload(payload);
        const destination = getDestinationFromDropPayload(payload);
        if (!source || !destination) return;
        const current = latest.current;
        if (current.isDropDisabled) {
          if (current.dropErrorMessage)
            setToast({ type: "warning", title: t("common.warning"), message: current.dropErrorMessage });
          return;
        }
        void current.handleOnDrop(source, destination);
        current.onDropped();
      },
    });
  }, [groupId, subGroupId, enter, leave, end, t]);

  // The wrapper stays mounted (it is the drop target) and stretches to the board's height, so the whole
  // collapsed column, not only its header, takes the drop.
  return (
    <div ref={ref} className="relative flex flex-shrink-0">
      {preview ? (
        <div className="group relative flex w-[336px] flex-shrink-0 flex-col rounded-lg bg-layer-1 p-2">
          <div className="sticky top-0 z-[2] w-full flex-shrink-0 bg-layer-1 px-1 py-1.5">{renderPreviewHeader()}</div>
          <div
            className={cn("min-h-[120px] flex-1 rounded-sm", {
              "ring-1 ring-accent-strong": !isDropDisabled,
              "ring-1 ring-danger-strong": isDropDisabled,
            })}
          >
            <div className="flex flex-col gap-2 p-2">
              {count > 0 && <div className="text-11 text-tertiary">+{count}</div>}
              <DropGhost preview={preview} invalid={isDropDisabled} />
            </div>
          </div>
        </div>
      ) : (
        children
      )}
    </div>
  );
}

type RowProps = {
  subGroupId: string;
  /** the board's visible columns, left to right, to place the ghost under the card's own column */
  columnIds: string[];
  isDropDisabled?: boolean;
  dropErrorMessage?: string;
  handleOnDrop: (source: GroupDropLocation, destination: GroupDropLocation) => Promise<void>;
  /** called after a drop, to expand the row */
  onDropped: () => void;
  /** the row's title strip; previewing: render it as expanded */
  renderHeader: (previewing: boolean) => ReactNode;
};

export function CollapsedRowDropZone(props: RowProps) {
  const { subGroupId, columnIds, isDropDisabled, dropErrorMessage, handleOnDrop, onDropped, renderHeader } = props;
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement | null>(null);
  const { preview, enter, leave, end } = useDropPreview();
  // per-render values for the drop handler, so the target registers once per row (not on every render)
  const latest = useRef({ isDropDisabled, dropErrorMessage, handleOnDrop, onDropped });
  latest.current = { isDropDisabled, dropErrorMessage, handleOnDrop, onDropped };

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    return dropTargetForElements({
      element,
      canDrop: isWorkItemDrag,
      // not a COLUMN: the destination column is the source's, which is known only during the drag
      getData: () => ({ subGroupId, type: "SUB_GROUP_ROW" }),
      onDragEnter: (payload) => {
        const source = getSourceFromDropPayload(payload);
        if (!source || source.subGroupId === subGroupId) return;
        enter(getDropPreview(payload.source.element, source.groupId));
      },
      onDragLeave: () => leave(),
      onDrop: (payload) => {
        end();
        const source = getSourceFromDropPayload(payload);
        if (!source || source.subGroupId === subGroupId) return;
        const current = latest.current;
        if (current.isDropDisabled) {
          if (current.dropErrorMessage)
            setToast({ type: "warning", title: t("common.warning"), message: current.dropErrorMessage });
          return;
        }
        const destination: GroupDropLocation = {
          groupId: source.groupId,
          subGroupId,
          columnId: `${source.groupId}__${subGroupId}`,
          id: undefined,
        };
        void current.handleOnDrop(source, destination);
        current.onDropped();
      },
    });
  }, [subGroupId, enter, leave, end, t]);

  return (
    <div
      ref={ref}
      className={cn("flex flex-shrink-0 flex-col rounded-sm", {
        "ring-1 ring-accent-strong": !!preview && !isDropDisabled,
        "ring-1 ring-danger-strong": !!preview && isDropDisabled,
      })}
    >
      {renderHeader(!!preview)}
      {preview && (
        // the same column grid as the row's KanBan (Row padding, 336px columns, gap-4)
        <Row className="flex flex-row gap-4 py-2">
          {columnIds.map((columnId) => (
            <div key={columnId} className="w-[336px] flex-shrink-0">
              {columnId === preview.sourceGroupId && <DropGhost preview={preview} invalid={isDropDisabled} />}
            </div>
          ))}
        </Row>
      )}
    </div>
  );
}
