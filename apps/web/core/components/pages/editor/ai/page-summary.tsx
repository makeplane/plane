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

import { cn } from "@plane/utils";
import { observer } from "mobx-react";
import { usePageStore, EPageStoreType } from "@/plane-web/hooks/store";
import { Sparkles, X } from "lucide-react";
import { IconButton } from "@plane/propel/icon-button";
import { PiIcon } from "@plane/propel/icons";
import { Streamdown } from "streamdown";
import { PageAiSummaryAction } from "./summary-action";

export const PageSummary = observer(function PageSummary({
  isGeneratingPageSummary,
  pageId,
  setIsGeneratingPageSummary,
}: {
  isGeneratingPageSummary: boolean;
  pageId: string;
  setIsGeneratingPageSummary: (isGenerating: boolean) => void;
}) {
  const { getPageAiSummary, removePageAiSummary } = usePageStore(EPageStoreType.WORKSPACE);
  const pageAiSummary = getPageAiSummary(pageId);

  const gradientBackground = `linear-gradient(to right, var(--label-purple-bg), var(--label-indigo-bg), var(--bg-accent-subtle-hover), var(--label-emerald-bg), var(--label-yellow-bg), var(--label-orange-bg), var(--label-crimson-bg), var(--label-pink-bg))`;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl px-4 border border-transparent transition-all duration-200 ease-in-out mt-6",
        {
          "h-[52px] border-subtle-1": isGeneratingPageSummary && !pageAiSummary,
          "border-subtle-1": pageAiSummary,
          "h-0": !isGeneratingPageSummary && !pageAiSummary,
        }
      )}
    >
      <div
        className="blur-[140px] absolute top-0 left-0 w-full h-full z-0 pointer-events-none"
        style={{ background: gradientBackground }}
      />
      {isGeneratingPageSummary && !pageAiSummary ? (
        <div className="h-[52px] flex items-center justify-start relative z-10">
          <span className="shimmer text-body-sm-regular">Generating summary of this page</span>
        </div>
      ) : (
        <div className="flex flex-col gap-3 py-3 relative z-10">
          <div className="flex justify-between items-center gap-2">
            <div className="flex items-center gap-2 text-tertiary">
              <Sparkles className="size-3" />
              <span className="text-body-sm-regular">AI summary</span>
            </div>
            <div className="flex items-center gap-2">
              {!isGeneratingPageSummary && (
                <>
                  <PageAiSummaryAction type="regenerate" pageId={pageId} handleLoading={setIsGeneratingPageSummary} />
                  <IconButton
                    icon={X}
                    variant="ghost"
                    size="sm"
                    color="secondary"
                    onClick={() => removePageAiSummary(pageId)}
                  />
                </>
              )}
            </div>
          </div>
          <div className="text-body-sm-regular text-primary">
            <Streamdown isAnimating={isGeneratingPageSummary}>{pageAiSummary ?? ""}</Streamdown>
          </div>
          <div className="flex items-center gap-2 text-placeholder">
            <PiIcon />
            <span className="text-body-sm-regular">Powered by Plane AI</span>
          </div>
        </div>
      )}
    </div>
  );
});
