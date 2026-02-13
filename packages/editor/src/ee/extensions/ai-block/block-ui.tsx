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

import { useEffect, useMemo, useState } from "react";
// version diff support
import { YChangeNodeViewWrapper } from "@/components/editors/version-diff/extensions/ychange-node-view-wrapper";
import CustomAIBlockPreview from "./preview";
import { CustomAIBlockSettings } from "./settings";
import { EAIBlockAttributeNames } from "./types";
import type { TAIBlockNodeViewProps, TAIBlockWidgetProps } from "./types";
import { CustomAIBlockSettingsFooter } from "./settings-footer";
import type { TAIBlockDetails } from "@plane/types";
import { cn } from "@plane/utils";

// Re-export for backwards compatibility
export type CustomAIBlockNodeViewProps = TAIBlockNodeViewProps;

// Props for the UI component (data passed from outside)
export type CustomAIBlockUIProps = TAIBlockNodeViewProps & TAIBlockWidgetProps;

/**
 * Pure UI component that receives data as props.
 * Used by the web app's widget callback to render the AI block with externally fetched data.
 */
export function CustomAIBlockUI(props: CustomAIBlockUIProps) {
  const { node, extension, blockTypes, blocks, editor } = props;
  // get handlers from extension options
  const { aiBlockHandlers, isFlagged } = extension.options;
  // derived values
  const isEmpty = node.textContent.trim().length === 0;
  const blockId = useMemo(() => node?.attrs[EAIBlockAttributeNames.ID], [node?.attrs]);
  // state
  const [isSettingsOpen, setIsSettingsOpen] = useState(isEmpty);
  const [block, setBlock] = useState<Partial<TAIBlockDetails> | undefined>(undefined);
  // derived values
  const blockDetails = useMemo(
    () => blocks?.find((data: TAIBlockDetails) => data.block_id === blockId),
    [blocks, blockId]
  );
  const selectedBlockType = useMemo(
    () => block && blockTypes?.find((type) => type.key === block?.block_type),
    [blockTypes, block]
  );
  const toggleSettings = () => setIsSettingsOpen((val) => !val);

  // set block details for existing blocks
  useEffect(() => {
    if (blockDetails) {
      setBlock(blockDetails);
    }
  }, [blockDetails]);

  // set default block type for new blocks
  useEffect(() => {
    if (!blockId && blockTypes && !block?.block_type) {
      setBlock({ block_type: blockTypes[0]?.key });
    }
  }, [blockId, blockTypes, block?.block_type]);

  const actionProps = {
    isEmpty,
    isDisabled: Boolean(selectedBlockType?.has_content && !block?.content) || !block?.block_type,
    block,
    selectedBlockType,
    aiBlockHandlers,
    blockId,
    toggleSettings,
    saveDocument: aiBlockHandlers?.saveDocument,
    ...props,
  };

  return (
    <YChangeNodeViewWrapper decorations={props.decorations} className="editor-ai-block-node group/ai-block-node">
      {isSettingsOpen && editor.isEditable && aiBlockHandlers ? (
        <div className="flex flex-col gap-4 relative bg-layer-2 border shadow-raised-100 rounded-xl my-2 transition-all duration-300 border-subtle-1 overflow-hidden">
          {
            <CustomAIBlockSettings
              blockTypes={blockTypes ?? []}
              aiBlockHandlers={aiBlockHandlers}
              isEmpty={isEmpty}
              blockId={blockId}
              setBlock={setBlock}
              block={block}
            />
          }
          <CustomAIBlockSettingsFooter type="settings" {...actionProps} isFlagged={isFlagged} />
        </div>
      ) : (
        <div
          className={cn(
            "relative flex items-center gap-4 border border-transparent rounded-lg p-0 transition-all duration-300",
            {
              "hover:border-accent-strong p-2": editor.isEditable,
            }
          )}
        >
          <CustomAIBlockPreview hasContent={!isEmpty} />
          {editor.isEditable && <CustomAIBlockSettingsFooter type="revision" {...actionProps} isFlagged={isFlagged} />}
        </div>
      )}
    </YChangeNodeViewWrapper>
  );
}
