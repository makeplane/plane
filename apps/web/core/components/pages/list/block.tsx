/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useRef, useState } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import type { InstructionType } from "@plane/types";
import { draggable, dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { attachInstruction, extractInstruction } from "@atlaskit/pragmatic-drag-and-drop-hitbox/tree-item";
import { observer } from "mobx-react";
import { Logo } from "@plane/propel/emoji-icon-picker";
import { PageIcon } from "@plane/propel/icons";
import { DragHandle, DropIndicator } from "@plane/ui";
// plane imports
import { getPageName } from "@plane/utils";
// components
import { ListItem } from "@/components/core/list";
import { BlockItemAction } from "@/components/pages/list/block-item-action";
// hooks
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane web hooks
import type { EPageStoreType } from "@/plane-web/hooks/store";
import { usePage } from "@/plane-web/hooks/store";

type TPageListBlock = {
  pageId: string;
  storeType: EPageStoreType;
  isLastChild: boolean;
  isReorderEnabled: boolean;
  onPageDrop: (sourcePageId: string, destinationPageId: string, edge: "reorder-above" | "reorder-below") => void;
};

export const PageListBlock = observer(function PageListBlock(props: TPageListBlock) {
  const { pageId, storeType, isLastChild, isReorderEnabled, onPageDrop } = props;
  // refs
  const parentRef = useRef<HTMLDivElement>(null);
  const dragHandleRef = useRef<HTMLSpanElement>(null);
  // states
  const [isDragging, setIsDragging] = useState(false);
  const [instruction, setInstruction] = useState<InstructionType | undefined>(undefined);
  // hooks
  const page = usePage({
    pageId,
    storeType,
  });
  const { isMobile } = usePlatformOS();
  // handle page check
  if (!page) return null;
  // derived values
  const { name, logo_props, getRedirectionLink } = page;

  useEffect(() => {
    const rowElement = parentRef.current;
    if (!rowElement || !isReorderEnabled) return;

    const initialData = { id: pageId, dragInstanceId: "PROJECT_PAGES" };
    return combine(
      draggable({
        element: rowElement,
        dragHandle: dragHandleRef.current ?? undefined,
        getInitialData: () => initialData,
        onDragStart: () => {
          setIsDragging(true);
        },
        onDrop: () => {
          setIsDragging(false);
        },
      }),
      dropTargetForElements({
        element: rowElement,
        canDrop: ({ source }) => source?.data?.id !== pageId && source?.data?.dragInstanceId === "PROJECT_PAGES",
        getData: ({ input, element: dropElement }) => {
          const blockedStates: InstructionType[] = ["make-child"];
          if (!isLastChild) blockedStates.push("reorder-below");
          return attachInstruction(initialData, {
            input,
            element: dropElement,
            currentLevel: 1,
            indentPerLevel: 0,
            mode: isLastChild ? "last-in-group" : "standard",
            block: blockedStates,
          });
        },
        onDrag: ({ self }) => {
          const currentInstruction = extractInstruction(self?.data)?.type;
          setInstruction(
            currentInstruction === "reorder-above" || currentInstruction === "reorder-below"
              ? currentInstruction
              : undefined
          );
        },
        onDragLeave: () => {
          setInstruction(undefined);
        },
        onDrop: ({ self, source }) => {
          setInstruction(undefined);
          const currentInstruction = extractInstruction(self?.data)?.type;
          if (currentInstruction !== "reorder-above" && currentInstruction !== "reorder-below") return;
          const sourcePageId = source?.data?.id as string | undefined;
          if (!sourcePageId) return;
          onPageDrop(sourcePageId, pageId, currentInstruction);
        },
      })
    );
  }, [isReorderEnabled, isLastChild, onPageDrop, pageId]);

  return (
    <div>
      <DropIndicator isVisible={instruction === "reorder-above"} />
      <ListItem
        prependTitleElement={
          <>
            {isReorderEnabled && (
              <span ref={dragHandleRef} className="flex cursor-grab items-center text-placeholder">
                <DragHandle className="bg-transparent" />
              </span>
            )}
            {logo_props?.in_use ? (
              <Logo logo={logo_props} size={16} type="lucide" />
            ) : (
              <PageIcon className="h-4 w-4 text-tertiary" />
            )}
          </>
        }
        title={getPageName(name)}
        itemLink={getRedirectionLink()}
        actionableItems={<BlockItemAction page={page} parentRef={parentRef} storeType={storeType} />}
        isMobile={isMobile}
        parentRef={parentRef}
        className={isDragging ? "cursor-grabbing bg-layer-1" : ""}
      />
      {isLastChild && <DropIndicator isVisible={instruction === "reorder-below"} />}
    </div>
  );
});
