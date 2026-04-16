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
import { useState } from "react";
import { cn } from "@plane/utils";
import { observer } from "mobx-react";
import { usePageStore, EPageStoreType } from "@/plane-web/hooks/store";
import { Sparkles, X } from "lucide-react";
import { IconButton } from "@plane/propel/icon-button";
import { PiIcon } from "@plane/propel/icons";
import { Streamdown } from "streamdown";
import { PageAiSummaryAction } from "./summary-action";
import { EPillSize, EPillVariant, ERadius, Pill } from "@plane/propel/pill";
import useSWR from "swr";

const isStale = (pageUpdatedAt: Date | string, summaryUpdatedAt: Date | string) => {
  const currentTime = new Date().getTime();
  const pageTime = new Date(pageUpdatedAt).getTime();
  const summaryTime = new Date(summaryUpdatedAt).getTime();

  if (currentTime - summaryTime < 60 * 1000) return false;
  return pageTime - summaryTime > 2 * 60 * 1000;
};
const gradientBackground = `linear-gradient(to right, var(--label-purple-bg), var(--label-indigo-bg), var(--bg-accent-subtle-hover), var(--label-emerald-bg), var(--label-yellow-bg), var(--label-orange-bg), var(--label-crimson-bg), var(--label-pink-bg))`;
export const PageSummary = observer(function PageSummary({
  workspaceSlug,
  isGeneratingPageSummary,
  pageId,
  storeType,
  setIsGeneratingPageSummary,
}: {
  workspaceSlug: string;
  isGeneratingPageSummary: boolean;
  pageId: string;
  storeType: EPageStoreType;
  setIsGeneratingPageSummary: (isGenerating: boolean) => void;
}) {
  const { getPageAiSummary, removePageAiSummary, getPageById, fetchPageAiSummary } = usePageStore(storeType);
  // state
  const [isDeletingSummary, setIsDeletingSummary] = useState(false);
  // hooks
  const summaryData = getPageAiSummary(pageId);
  const page = getPageById(pageId);
  // derived
  const summary = summaryData?.summary;
  const updatedAt = summaryData?.updated_at;

  // fetch page AI summary
  useSWR(pageId ? ["AI_PAGES_SUMMARY", pageId] : null, pageId ? () => fetchPageAiSummary(pageId) : null, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  const handleDelete = async () => {
    try {
      setIsDeletingSummary(true);
      await removePageAiSummary(pageId);
    } catch (error) {
      console.error("Failed to delete page AI summary", error);
    } finally {
      setIsDeletingSummary(false);
    }
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl px-4 border border-transparent transition-all duration-200 ease-in-out mt-6",
        {
          "h-[52px] border-subtle-1": isGeneratingPageSummary && !summary,
          "border-subtle-1": summary,
          "h-0": !isGeneratingPageSummary && !summary,
        }
      )}
    >
      <div
        className="blur-[140px] absolute top-0 left-0 w-full h-full z-0 pointer-events-none"
        style={{ background: gradientBackground }}
      />
      {isGeneratingPageSummary && !summary ? (
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
                  {page?.updated_at && updatedAt && isStale(page.updated_at, updatedAt) && (
                    <Pill
                      variant={EPillVariant.WARNING}
                      size={EPillSize.SM}
                      radius={ERadius.SQUARE}
                      className="border-none bg-warning-subtle text-warning-secondary"
                    >
                      Stale
                    </Pill>
                  )}
                  <PageAiSummaryAction
                    workspaceSlug={workspaceSlug}
                    isGenerating={isGeneratingPageSummary}
                    type="regenerate"
                    pageId={pageId}
                    storeType={storeType}
                    handleLoading={setIsGeneratingPageSummary}
                    updatedAt={updatedAt}
                  />
                  <IconButton
                    loading={isDeletingSummary}
                    icon={X}
                    variant="ghost"
                    size="sm"
                    color="secondary"
                    onClick={handleDelete}
                  />
                </>
              )}
            </div>
          </div>
          <div className="text-body-sm-regular text-primary">
            <Streamdown isAnimating={isGeneratingPageSummary}>{summary ?? ""}</Streamdown>
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
