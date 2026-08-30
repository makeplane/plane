/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { pointerOutsideOfPreview } from "@atlaskit/pragmatic-drag-and-drop/element/pointer-outside-of-preview";
import { setCustomNativeDragPreview } from "@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview";
import { createRoot } from "react-dom/client";

type CalendarDragPreviewContent = {
  title: string;
  subtitle?: string;
  grabOffsetX?: number;
  grabOffsetY?: number;
  /** When set, renders a block-sized preview instead of a compact card. */
  blockHeight?: number;
  blockWidth?: number;
};

type GenerateDragPreviewArgs = {
  nativeSetDragImage: ((image: Element, x: number, y: number) => void) | null;
};

export const createCalendarDragPreviewHandler =
  (getContent: () => CalendarDragPreviewContent) =>
  ({ nativeSetDragImage }: GenerateDragPreviewArgs) => {
    if (!nativeSetDragImage) return;

    const { title, subtitle, grabOffsetX, grabOffsetY, blockHeight, blockWidth } = getContent();

    setCustomNativeDragPreview({
      getOffset: pointerOutsideOfPreview({
        x: grabOffsetX != null ? `${grabOffsetX}px` : "8px",
        y: grabOffsetY != null ? `${grabOffsetY}px` : "8px",
      }),
      render: ({ container }) => {
        const root = createRoot(container);
        const isBlockPreview = blockHeight != null && blockHeight > 0;

        root.render(
          isBlockPreview ? (
            <div
              className="flex flex-col overflow-hidden rounded-sm bg-surface-2/95 shadow-raised-300"
              style={{ width: blockWidth ?? 160, height: blockHeight, minHeight: 28 }}
            >
              <div className="flex min-h-0 flex-1 flex-col px-1.5 py-1">
                <div className="truncate text-11 font-semibold text-primary">{title}</div>
                {subtitle ? <div className="truncate text-9 font-medium text-accent-primary">{subtitle}</div> : null}
              </div>
            </div>
          ) : (
            <div className="max-w-[220px] rounded-sm bg-surface-2 px-2 py-1.5 shadow-raised-200">
              <div className="truncate text-11 font-medium text-primary">{title}</div>
              {subtitle ? <div className="truncate text-9 text-tertiary">{subtitle}</div> : null}
            </div>
          )
        );
        return () => root.unmount();
      },
      nativeSetDragImage,
    });
  };
