"use client";

import { FC, useRef } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { Link2, MoveDiagonal, MoveRight, Sidebar } from "lucide-react";
// constants
import { EIssueServiceType } from "@plane/constants";
// types
import { TIssue } from "@plane/types";
// ui
import {
  CenterPanelIcon,
  CustomSelect,
  FullScreenPanelIcon,
  SidePanelIcon,
  TOAST_TYPE,
  Tooltip,
  setToast,
} from "@plane/ui";
import { EUserPermissions, EUserPermissionsLevel } from "@/ce/constants";
// components
import { NameDescriptionUpdateStatus } from "@/components/issues";
// constants
import { EIssuesStoreType } from "@/constants/issue";
// helpers
import { cn } from "@/helpers/common.helper";
import { copyUrlToClipboard } from "@/helpers/string.helper";
// store hooks
import { useAppTheme, useIssueDetail, useUserPermissions } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
import { useIssuesActions } from "@/hooks/use-issues-actions";

// hooks
import { usePlatformOS } from "@/hooks/use-platform-os";
import { ProjectEpicQuickActions } from "../epic-quick-action";
export type TPeekModes = "side-peek" | "modal" | "full-screen";

const PEEK_OPTIONS: { key: TPeekModes; icon: any; title: string }[] = [
  {
    key: "side-peek",
    icon: SidePanelIcon,
    title: "Side Peek",
  },
  {
    key: "modal",
    icon: CenterPanelIcon,
    title: "Modal",
  },
  {
    key: "full-screen",
    icon: FullScreenPanelIcon,
    title: "Full Screen",
  },
];

export type PeekOverviewHeaderProps = {
  peekMode: TPeekModes;
  setPeekMode: (value: TPeekModes) => void;
  removeRoutePeekId: () => void;
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  isArchived: boolean;
  disabled: boolean;
  embedIssue: boolean;
  toggleDeleteIssueModal: (issueId: string | null) => void;
  toggleArchiveIssueModal: (issueId: string | null) => void;
  handleRestoreIssue: () => void;
  isSubmitting: "submitting" | "submitted" | "saved";
};

export const EpicPeekOverviewHeader: FC<PeekOverviewHeaderProps> = observer((props) => {
  const {
    peekMode,
    setPeekMode,
    workspaceSlug,
    projectId,
    issueId,
    isArchived,
    disabled,
    embedIssue = false,
    removeRoutePeekId,
    isSubmitting,
  } = props;
  // router
  const router = useAppRouter();
  // ref
  const parentRef = useRef<HTMLDivElement>(null);
  // store hooks
  const {
    issue: { getIssueById },
  } = useIssueDetail(EIssueServiceType.EPICS);
  const { updateIssue, removeIssue } = useIssuesActions(EIssuesStoreType.EPIC);
  const { allowPermissions } = useUserPermissions();
  const { epicDetailSidebarCollapsed, toggleEpicDetailSidebar } = useAppTheme();

  const { isMobile } = usePlatformOS();
  // derived values
  const currentMode = PEEK_OPTIONS.find((m) => m.key === peekMode);
  const issue = getIssueById(issueId);

  const issueLink = `${workspaceSlug}/projects/${projectId}/${isArchived ? "archives/" : ""}epics/${issueId}`;

  const handleCopyText = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    copyUrlToClipboard(issueLink).then(() => {
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Link Copied!",
        message: "Issue link copied to clipboard.",
      });
    });
  };

  const handleDelete = async () => {
    if (issue) {
      await removeIssue(issue.project_id, issue.id).then(() => {
        // TODO: add toast
        router.push(`/${workspaceSlug}/projects/${projectId}/epics`);
      });
    }
  };

  const handleUpdate = async (data: Partial<TIssue>) => {
    if (issue && updateIssue) {
      // TODO: add toast
      updateIssue(issue.project_id, issue.id, data);
    }
  };

  const isEditingAllowed = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.PROJECT
  );

  return (
    <div className={`relative flex items-center justify-between p-4 border-b border-custom-border-200 `}>
      <div className="flex items-center gap-4">
        <Tooltip tooltipContent="Close the peek view" isMobile={isMobile}>
          <button onClick={removeRoutePeekId}>
            <MoveRight className="h-4 w-4 text-custom-text-300 hover:text-custom-text-200" />
          </button>
        </Tooltip>

        <Tooltip tooltipContent="Open issue in full screen" isMobile={isMobile}>
          <Link href={`/${issueLink}`} onClick={() => removeRoutePeekId()}>
            <MoveDiagonal className="h-4 w-4 text-custom-text-300 hover:text-custom-text-200" />
          </Link>
        </Tooltip>
        {currentMode && embedIssue === false && (
          <div className="flex flex-shrink-0 items-center gap-2">
            <CustomSelect
              value={currentMode}
              onChange={(val: any) => setPeekMode(val)}
              customButton={
                <Tooltip tooltipContent="Toggle peek view layout" isMobile={isMobile}>
                  <button type="button" className="">
                    <currentMode.icon className="h-4 w-4 text-custom-text-300 hover:text-custom-text-200" />
                  </button>
                </Tooltip>
              }
            >
              {PEEK_OPTIONS.map((mode) => (
                <CustomSelect.Option key={mode.key} value={mode.key}>
                  <div
                    className={`flex items-center gap-1.5 ${
                      currentMode.key === mode.key
                        ? "text-custom-text-200"
                        : "text-custom-text-400 hover:text-custom-text-200"
                    }`}
                  >
                    <mode.icon className="-my-1 h-4 w-4 flex-shrink-0" />
                    {mode.title}
                  </div>
                </CustomSelect.Option>
              ))}
            </CustomSelect>
          </div>
        )}
      </div>
      <div className="flex items-center gap-x-4">
        <NameDescriptionUpdateStatus isSubmitting={isSubmitting} />
        <div className="flex items-center gap-4">
          <Tooltip tooltipContent="Copy link" isMobile={isMobile}>
            <button type="button" onClick={handleCopyText}>
              <Link2 className="h-4 w-4 -rotate-45 text-custom-text-300 hover:text-custom-text-200" />
            </button>
          </Tooltip>
          {issue && (
            <div ref={parentRef} className="flex items-center gap-2">
              <ProjectEpicQuickActions
                parentRef={parentRef}
                issue={issue}
                handleDelete={handleDelete}
                handleUpdate={handleUpdate}
                readOnly={!isEditingAllowed}
              />
              <Sidebar
                className={cn("size-4 cursor-pointer", {
                  "text-custom-primary-100": epicDetailSidebarCollapsed,
                })}
                onClick={() => toggleEpicDetailSidebar(!epicDetailSidebarCollapsed)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
