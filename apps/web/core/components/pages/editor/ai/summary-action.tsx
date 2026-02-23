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

import { useWorkspace } from "@/hooks/store/use-workspace";
import { EPageStoreType, usePageStore } from "@/plane-web/hooks/store";
import { Button } from "@plane/propel/button";
import { IconButton } from "@plane/propel/icon-button";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { Tooltip } from "@plane/propel/tooltip";
import { renderFormattedDate, renderFormattedTime } from "@plane/utils";
import { RefreshCcwIcon, Sparkles } from "lucide-react";
import { observer } from "mobx-react";

export const PageAiSummaryAction = observer(function PageAiSummaryAction(props: {
  workspaceSlug: string;
  pageId: string | undefined;
  storeType: EPageStoreType;
  type?: "generate" | "regenerate";
  updatedAt?: string;
  isGenerating: boolean;
  handleLoading: (isGenerating: boolean) => void;
}) {
  const { workspaceSlug, pageId, storeType, type, handleLoading, updatedAt, isGenerating } = props;
  const { generatePageAiSummary } = usePageStore(storeType);
  const { getWorkspaceBySlug } = useWorkspace();
  const workspaceId = getWorkspaceBySlug(workspaceSlug)?.id;
  const handleGeneratePageAiSummary = () => {
    if (!pageId || !workspaceId) return;

    handleLoading(true);

    const abort = generatePageAiSummary(pageId, workspaceId, {
      onComplete: () => {
        handleLoading(false);
      },
      onError: () => {
        handleLoading(false);
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error",
          message: "Failed to generate page AI summary",
        });
      },
    });

    if (!abort) {
      handleLoading(false);
    }
  };
  if (type === "regenerate") {
    return (
      <Tooltip
        tooltipContent={
          updatedAt && `Last updated on ${renderFormattedDate(updatedAt)} at ${renderFormattedTime(updatedAt)}`
        }
      >
        <IconButton
          icon={RefreshCcwIcon}
          variant="ghost"
          size="sm"
          color="secondary"
          onClick={handleGeneratePageAiSummary}
          disabled={isGenerating}
        />
      </Tooltip>
    );
  }

  return (
    <Button
      variant="tertiary"
      size="base"
      onClick={handleGeneratePageAiSummary}
      prependIcon={<Sparkles className="size-3" />}
      disabled={isGenerating}
    >
      AI summary
    </Button>
  );
});
