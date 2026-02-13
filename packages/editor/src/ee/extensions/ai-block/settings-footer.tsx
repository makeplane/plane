/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { Button, getButtonStyling } from "@plane/propel/button";
import type { TAIBlockDetails, TAIBlockGenerateInputPartial, TAIBlockHandlers, TAIBlockType } from "@plane/types";
import { cn, renderFormattedDate } from "@plane/utils";
import { useMemo, useRef, useState } from "react";
import { EAIBlockAttributeNames } from "./types";
import type { TAIBlockAttributes } from "./types";
import type { Editor, NodeViewProps } from "@tiptap/react";
import { AIBlockFeedback } from "./feedback";
import { Tooltip } from "@plane/propel/tooltip";
import { Settings } from "lucide-react";
import { IconButton } from "@plane/propel/icon-button";
import {
  autoUpdate,
  flip,
  hide,
  shift,
  useDismiss,
  useFloating,
  useHover,
  useInteractions,
  FloatingPortal,
} from "@floating-ui/react";
import { UpgradeNowModal } from "@/plane-editor/components/modal/upgrade-modal";
type CustomAIBlockSettingsFooterProps = {
  editor: Editor;
  node: NodeViewProps["node"] & {
    attrs: TAIBlockAttributes;
  };
  isEmpty: boolean;
  isDisabled: boolean;
  aiBlockHandlers: TAIBlockHandlers | undefined;
  selectedBlockType: TAIBlockType | undefined;
  block: Partial<TAIBlockDetails> | undefined;
  blockId: string | null;
  type: "settings" | "revision";
  isFlagged?: boolean;
  getPos: () => number;
  updateAttributes: (attrs: Partial<TAIBlockAttributes>) => void;
  toggleSettings: () => void;
  saveDocument?: () => Promise<void>;
};

export const CustomAIBlockSettingsFooter = (props: CustomAIBlockSettingsFooterProps) => {
  const {
    editor,
    node,
    isEmpty,
    isDisabled,
    aiBlockHandlers,
    selectedBlockType,
    block,
    blockId,
    type,
    getPos,
    updateAttributes,
    toggleSettings,
    saveDocument,
    isFlagged,
  } = props;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const referenceElement = useRef<HTMLDivElement>(null);
  const editedAt = useMemo(() => renderFormattedDate((block?.updated_at || block?.created_at) ?? ""), [block]);

  const { refs, floatingStyles, context } = useFloating({
    open: showUpgradeModal,
    onOpenChange: setShowUpgradeModal,
    elements: {
      reference: referenceElement.current,
    },
    middleware: [
      flip({
        fallbackPlacements: ["top", "bottom"],
      }),
      shift({
        padding: 5,
      }),
      hide(),
    ],
    whileElementsMounted: autoUpdate,
    placement: "bottom-start",
  });
  // handlers
  const hover = useHover(context, { enabled: !!isFlagged });
  const dismiss = useDismiss(context);
  const { getReferenceProps, getFloatingProps } = useInteractions([hover, dismiss]);

  const handleInsert = (content: string) => {
    const pos = getPos() + 1;
    const from = pos + 1; // Start of node content
    const to = pos + 1 + node.content.size; // End of node content
    editor
      .chain()
      .focus()
      .insertContentAt({ from, to }, content ?? "")
      .run();
  };
  const handleDelete = () => {
    if (isFlagged) return;
    const pos = getPos();
    editor
      .chain()
      .focus()
      .deleteRange({ from: pos, to: pos + node.nodeSize })
      .run();
  };
  const handleGenerate = async () => {
    if (!aiBlockHandlers || !selectedBlockType?.key) return;
    if (isFlagged) return;
    setIsSubmitting(true);
    try {
      let payload: TAIBlockGenerateInputPartial = {
        block_type: selectedBlockType?.key,
        content: selectedBlockType?.has_content ? (block?.content ?? "") : undefined,
      };

      if (blockId) {
        // Update existing block
        payload = { ...payload, block_id: blockId };
      }
      const response = await aiBlockHandlers.generateBlockContent(payload);
      if (response?.content) {
        handleInsert(response.content);
      }
      // Update node attributes with the response
      updateAttributes({
        [EAIBlockAttributeNames.ID]: response.block_id,
      });
    } catch (error) {
      console.error("Failed to save AI block:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <>
      <div
        ref={referenceElement}
        className={cn({
          "bg-layer-2 border-t border-subtle p-3 flex items-center justify-between gap-2": type === "settings",
          "opacity-0 flex group-hover/ai-block-node:opacity-100 absolute bottom-1 right-0 bg-layer-2 shadow-raised-100 rounded-lg  p-1 items-center justify-end gap-3":
            type === "revision",
        })}
        contentEditable={false}
        {...getReferenceProps()}
      >
        <div className="flex items-center gap-2">
          {!isEmpty && (
            <AIBlockFeedback
              feedback={block?.feedback}
              blockId={blockId}
              aiBlockHandlers={aiBlockHandlers}
              type={type}
              isFlagged={isFlagged}
            />
          )}
          {type === "revision" && (
            <Tooltip tooltipContent="Bad response" position="bottom" className="mb-4">
              <IconButton
                icon={Settings}
                onClick={() => {
                  if (isFlagged) return;
                  toggleSettings();
                }}
                variant="ghost"
                size="sm"
              />
            </Tooltip>
          )}
        </div>
        <div className="flex items-center gap-2">
          {type === "settings" && (
            <Button variant="ghost" size="base" onClick={handleDelete}>
              Discard
            </Button>
          )}
          {isEmpty ? (
            <Tooltip
              tooltipContent={`Generated by Plane AI ${editedAt ? `on ${editedAt}` : ""}`}
              position="bottom"
              className="mb-4"
            >
              <Button
                className={cn(getButtonStyling("primary", "base"))}
                onClick={() => void handleGenerate()}
                disabled={isSubmitting || isDisabled}
              >
                {isSubmitting ? "Generating" : "Generate"}
              </Button>
            </Tooltip>
          ) : (
            <Tooltip
              tooltipContent={`Generated by Plane AI ${editedAt ? `on ${editedAt}` : ""}`}
              position="bottom"
              className="mb-4"
            >
              <Button
                variant={type === "settings" ? "secondary" : "primary"}
                size="base"
                onClick={() => void handleGenerate()}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Regenerating" : "Regenerate"}
              </Button>
            </Tooltip>
          )}
          {!isEmpty && type === "settings" && (
            <Button
              variant="primary"
              size="base"
              onClick={() => {
                if (isFlagged) return;
                void saveDocument?.();
                toggleSettings();
              }}
              disabled={isSubmitting}
            >
              Use this
            </Button>
          )}
        </div>
      </div>
      {showUpgradeModal && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            className="mt-1.5"
            style={{
              ...floatingStyles,
              zIndex: 99,
            }}
            {...getFloatingProps()}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <UpgradeNowModal />
          </div>
        </FloatingPortal>
      )}
    </>
  );
};
