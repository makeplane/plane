/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState, useRef, forwardRef } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { MoreHorizontalOutline } from "@makeplane/propel/icons";
import { IconButton } from "@makeplane/propel/components/icon-button";
// plane imports
import { useOutsideClickDetector } from "@plane/hooks";
import { useTranslation } from "@plane/i18n";
import { Popover, PopoverContent, PopoverTrigger } from "@makeplane/propel/components/popover";
import type { TIssue } from "@plane/types";
import { ControlLink } from "@plane/blocks/layout";
import { cn, generateWorkItemLink } from "@plane/utils";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useIssues } from "@/hooks/store/use-issues";
import { useProject } from "@/hooks/store/use-project";
import { useProjectState } from "@/hooks/store/use-project-state";
import { useIssueStoreType } from "@/hooks/use-issue-layout-store";
import useIssuePeekOverviewRedirection from "@/hooks/use-issue-peek-overview-redirection";
import { usePlatformOS } from "@/hooks/use-platform-os";
// local components
import { WorkItemPreviewCard } from "../../preview-card";
import type { TRenderQuickActions } from "../list/list-view-types";
import type { CalendarStoreType } from "./base-calendar-root";

type Props = {
  issue: TIssue;
  quickActions: TRenderQuickActions;
  isDragging?: boolean;
  isEpic?: boolean;
};

export const CalendarIssueBlock = observer(
  forwardRef(function CalendarIssueBlock(props: Props, ref: React.ForwardedRef<HTMLAnchorElement>) {
    const { issue, quickActions, isDragging = false, isEpic = false } = props;
    // states
    const [isMenuActive, setIsMenuActive] = useState(false);
    // refs
    const blockRef = useRef(null);
    const menuActionRef = useRef<HTMLButtonElement | null>(null);
    // hooks
    const { workspaceSlug } = useParams();
    const { t } = useTranslation();
    const { getProjectStates } = useProjectState();
    const { getIsIssuePeeked } = useIssueDetail();
    const { handleRedirection } = useIssuePeekOverviewRedirection(isEpic);
    const { isMobile } = usePlatformOS();
    const storeType = useIssueStoreType() as CalendarStoreType;
    const { issuesFilter } = useIssues(storeType);
    const { getProjectIdentifierById } = useProject();

    const stateColor = getProjectStates(issue?.project_id)?.find((state) => state?.id == issue?.state_id)?.color || "";
    const projectIdentifier = getProjectIdentifierById(issue?.project_id);
    const showWorkItemKey = issuesFilter?.issueFilters?.displayProperties?.key ?? true;
    const workItemId = `${projectIdentifier}-${issue.sequence_id}`;

    // handlers
    const handleIssuePeekOverview = (peekIssue: TIssue) =>
      handleRedirection(workspaceSlug?.toString(), peekIssue, isMobile);

    useOutsideClickDetector(menuActionRef, () => setIsMenuActive(false));

    const customActionButton = (
      // The quick-action menu grafts its trigger behaviour onto this element (MenuTrigger render),
      // so it has to be a real button.
      <IconButton
        ref={menuActionRef}
        variant="ghost"
        size="xs"
        aria-label={t("aria_labels.common.more_actions")}
        showTooltip={false}
        icon={<MoreHorizontalOutline className="size-3.5" />}
        onClick={() => setIsMenuActive(!isMenuActive)}
      />
    );

    const isMenuActionRefAboveScreenBottom =
      typeof window !== "undefined" &&
      menuActionRef?.current &&
      menuActionRef?.current?.getBoundingClientRect().bottom < window.innerHeight - 220;

    const placement = isMenuActionRefAboveScreenBottom ? "bottom-end" : "top-end";

    const workItemLink = generateWorkItemLink({
      workspaceSlug: workspaceSlug?.toString(),
      projectId: issue?.project_id,
      issueId: issue?.id,
      projectIdentifier,
      sequenceId: issue?.sequence_id,
      isEpic,
      isArchived: !!issue?.archived_at,
    });

    return (
      <Popover>
        <PopoverTrigger
          openOnHover
          delay={100}
          render={
            <ControlLink
              id={`issue-${issue.id}`}
              href={workItemLink}
              onClick={() => handleIssuePeekOverview(issue)}
              className="block w-full rounded-lg border-b border-subtle text-body-xs-regular text-primary hover:border-subtle-1 md:border-[1px]"
              disabled={!!issue?.tempId || isMobile}
              ref={ref}
            >
              <>
                {issue?.tempId !== undefined && (
                  <div className="absolute top-0 left-0 z-[99999] h-full w-full animate-pulse bg-surface-1/20" />
                )}

                <div
                  ref={blockRef}
                  className={cn(
                    "group/calendar-block flex h-10 w-full min-w-0 items-center justify-between gap-1.5 overflow-hidden rounded-lg bg-layer-2 px-4 py-1.5 md:h-8 md:px-1",
                    {
                      "border border-accent-strong bg-layer-2-hover shadow-raised-200": isDragging,
                      "hover:bg-layer-2-hover": !isDragging,
                      "border border-accent-strong hover:border-accent-strong": getIsIssuePeeked(issue.id),
                    }
                  )}
                >
                  <div className="flex h-full min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
                    <span
                      className="h-full w-0.5 flex-shrink-0 rounded-sm"
                      style={{
                        backgroundColor: stateColor,
                      }}
                    />
                    {showWorkItemKey && projectIdentifier && (
                      // In a narrow day cell the project key truncates before the sequence number does.
                      <span
                        className="flex min-w-0 items-center overflow-hidden text-caption-md-medium whitespace-nowrap text-tertiary"
                        title={workItemId}
                      >
                        <span aria-hidden="true" className="min-w-0 truncate">
                          {projectIdentifier}-
                        </span>
                        <span aria-hidden="true" className="shrink-0 tabular-nums">
                          {issue.sequence_id}
                        </span>
                        <span className="sr-only">{workItemId}</span>
                      </span>
                    )}
                    <div className="min-w-0 flex-1 truncate text-caption-md-medium lg:text-body-xs-regular">
                      {issue.name}
                    </div>
                  </div>
                  {/* Wrapper exists only to stop clicks reaching the ControlLink; the
                      quick-action menu inside carries its own interactive semantics. */}
                  <div
                    role="presentation"
                    className={cn("flex h-5 w-5 flex-shrink-0 justify-end", {
                      // Collapse rather than unmount, so the open menu keeps its anchor.
                      "invisible w-0 group-hover/calendar-block:visible group-hover/calendar-block:w-5 has-[[data-popup-open]]:visible has-[[data-popup-open]]:w-5":
                        !isMobile && !isMenuActive,
                    })}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                  >
                    {quickActions({
                      issue,
                      parentRef: blockRef,
                      customActionButton,
                      placement,
                    })}
                  </div>
                </div>
              </>
            </ControlLink>
          }
        />
        <PopoverContent variant="rich" side="bottom" align="start" sideOffset={8}>
          {issue.project_id && (
            <WorkItemPreviewCard
              projectId={issue.project_id}
              stateDetails={{
                id: issue.state_id ?? undefined,
              }}
              workItem={issue}
            />
          )}
        </PopoverContent>
      </Popover>
    );
  })
);

CalendarIssueBlock.displayName = "CalendarIssueBlock";
