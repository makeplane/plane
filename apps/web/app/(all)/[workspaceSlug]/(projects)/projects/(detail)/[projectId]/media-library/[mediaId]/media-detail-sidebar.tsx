"use client";

import { useEffect } from "react";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import type { TMediaItem } from "../types";
import { DetailIssueOverview } from "./detail-peek-overview";

type TMediaDetailSidebarProps = {
  workspaceSlug: string;
  projectId: string;
  item: TMediaItem;
  onMediaItemUpdated?: (updates?: Partial<TMediaItem>) => void;
};

export const MediaDetailSidebar = ({ workspaceSlug, projectId, item, onMediaItemUpdated }: TMediaDetailSidebarProps) => {
  const { setPeekIssue } = useIssueDetail();
  const workItemId = item?.workItemId ?? "";
  const sidebarClassName =
    "w-full min-w-[300px] border-l border-custom-border-200 bg-custom-sidebar-background-100 py-5 lg:min-w-80 xl:min-w-96 lg:h-full lg:overflow-hidden lg:overscroll-y-contain";

  useEffect(() => {
    if (!workItemId) return;
    setPeekIssue({ workspaceSlug, projectId, issueId: workItemId });
  }, [projectId, setPeekIssue, workItemId, workspaceSlug]);

  if (!workItemId) {
    return (
      <div className={sidebarClassName}>
        <div className="px-6 text-sm text-custom-text-300">No linked work item found for this media.</div>
      </div>
    );
  }

  return (
    <div className={sidebarClassName}>
      <DetailIssueOverview embedIssue mediaItem={item} onMediaItemUpdated={onMediaItemUpdated} />
    </div>
  );
};
