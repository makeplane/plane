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

import { EPageStoreType, usePageStore } from "@/plane-web/hooks/store";
import { Button } from "@plane/propel/button";
import { IconButton } from "@plane/propel/icon-button";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { RefreshCcwIcon, Sparkles } from "lucide-react";
import { observer } from "mobx-react";

export const PageAiSummaryAction = observer(function PageAiSummaryAction(props: {
  pageId: string | undefined;
  type?: "generate" | "regenerate";
  handleLoading: (isGenerating: boolean) => void;
}) {
  const { pageId, type, handleLoading } = props;
  const { fetchPageAiSummary } = usePageStore(EPageStoreType.WORKSPACE);

  const handleGeneratePageAiSummary = () => {
    if (!pageId) return;

    handleLoading(true);

    const abort = fetchPageAiSummary(pageId, {
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
      <IconButton
        icon={RefreshCcwIcon}
        variant="ghost"
        size="sm"
        color="secondary"
        onClick={handleGeneratePageAiSummary}
      />
    );
  }

  return (
    <Button
      variant="tertiary"
      size="base"
      onClick={handleGeneratePageAiSummary}
      prependIcon={<Sparkles className="size-3" />}
    >
      AI summary
    </Button>
  );
});
