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

import { useRef } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { Ellipsis, Timer } from "lucide-react";
// plane imports
import { Tooltip } from "@plane/propel/tooltip";
import type { TIssueActivityComment } from "@plane/types";
import { CustomMenu, Popover } from "@plane/ui";
import {
  getFileURL,
  calculateTimeAgo,
  convertMinutesToHoursMinutesString,
  renderFormattedDate,
  renderFormattedTime,
} from "@plane/utils";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane web hooks
import { useWorklog, useWorkspaceWorklogs } from "@/plane-web/hooks/store";
// local imports
import { WorklogUpdate } from "../create-update";

type TIssueActivityWorklog = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  activityComment: TIssueActivityComment;
  ends: "top" | "bottom" | undefined;
};

export const IssueActivityWorklog = observer(function IssueActivityWorklog(props: TIssueActivityWorklog) {
  const { workspaceSlug, projectId, issueId, activityComment, ends } = props;
  // hooks
  const { deleteWorklogById } = useWorkspaceWorklogs();
  const { asJson: worklog } = useWorklog(activityComment?.id);
  const { isMobile } = usePlatformOS();
  const {
    workspace: { getWorkspaceMemberDetails },
  } = useMember();
  // ref
  const popoverButtonRef = useRef<HTMLButtonElement | null>(null);

  // derived values
  const currentUser = (worklog?.logged_by && getWorkspaceMemberDetails(worklog?.logged_by)) || undefined;

  const popoverOptions = [
    {
      value: "edit",
      label: "Edit",
      onClick: () => popoverButtonRef.current?.click(),
    },
    {
      value: "delete",
      label: "Delete",
      onClick: async () => {
        try {
          if (!worklog?.id) return;
          await deleteWorklogById(workspaceSlug, projectId, issueId, worklog?.id);
        } catch (error) {
          console.error("error", error);
        }
      },
    },
  ];

  return (
    <div
      className={`relative flex items-center gap-3 text-caption-sm-regular ${
        ends === "top" ? `pb-2` : ends === "bottom" ? `pt-2` : `py-2`
      } ${!worklog?.description ? "" : "items-start"}`}
    >
      <div className="absolute left-[13px] top-0 bottom-0 w-px bg-layer-3" aria-hidden />
      <div className="flex-shrink-0 relative w-7 h-7 rounded-lg overflow-visible flex justify-center items-center z-[4] bg-layer-2 text-secondary transition-border duration-1000 border border-subtle shadow-raised-100">
        {currentUser?.member?.avatar_url && currentUser?.member?.avatar_url !== "" ? (
          <img
            src={getFileURL(currentUser?.member?.avatar_url)}
            alt={currentUser?.member?.display_name}
            height={28}
            width={28}
            className="h-full w-full object-cover rounded-lg"
          />
        ) : (
          <span className="uppercase font-medium">
            {currentUser?.member?.first_name
              ? currentUser?.member?.first_name.charAt(0)
              : currentUser?.member?.display_name?.charAt(0)}
          </span>
        )}
        <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full flex justify-center items-center bg-layer-1 border border-subtle shadow-raised-100 z-10">
          <Timer className="w-2 h-2 text-secondary" />
        </div>
      </div>
      <div className="w-full space-y-1.5">
        <div className="w-full relative flex items-center">
          <div className="flex w-full truncate gap-1 text-secondary">
            <Link
              href={`/${workspaceSlug}/profile/${currentUser?.member?.id}`}
              className="hover:underline text-primary font-medium"
            >
              {currentUser?.member?.display_name}
            </Link>
            <span className="text-secondary">{` logged `}</span>
            <span className="text-primary font-medium">{`${convertMinutesToHoursMinutesString(worklog?.duration || 0)}.`}</span>
            {worklog.created_at && (
              <span>
                <Tooltip
                  isMobile={isMobile}
                  tooltipContent={`${renderFormattedDate(worklog.created_at)}, ${renderFormattedTime(worklog.created_at)}`}
                >
                  <span className="whitespace-nowrap text-tertiary"> {calculateTimeAgo(worklog.created_at)}</span>
                </Tooltip>
              </span>
            )}
          </div>
          <div className="flex-shrink-0 relative">
            <div className="absolute right-0 bottom-0">
              <Popover
                button={<></>}
                popoverButtonRef={popoverButtonRef}
                buttonClassName="w-0 h-0"
                panelClassName="w-72 my-1 rounded-sm border-[0.5px] border-subtle-1 bg-surface-1 p-3 text-11 shadow-raised-200 focus:outline-none"
              >
                <WorklogUpdate
                  workspaceSlug={workspaceSlug}
                  projectId={projectId}
                  issueId={issueId}
                  worklogId={activityComment?.id}
                  handleClose={() => popoverButtonRef.current?.click()}
                />
              </Popover>
            </div>
            <CustomMenu
              maxHeight={"md"}
              className="flex flex-grow justify-center text-13 text-secondary"
              placement="bottom-start"
              customButton={
                <div className="w-5 h-5 flex justify-center items-center overflow-hidden rounded-sm hover:bg-layer-1 transition-all">
                  <Ellipsis className="w-3.5 h-3.5 font-medium" />
                </div>
              }
              customButtonClassName="flex flex-grow justify-center text-secondary text-13"
              closeOnSelect
            >
              {popoverOptions.map((option) => (
                <CustomMenu.MenuItem key={option.value} onClick={option.onClick}>
                  <div className="text-tertiary">{option.label}</div>
                </CustomMenu.MenuItem>
              ))}
            </CustomMenu>
          </div>
        </div>
        {worklog?.description && (
          <div className="border border-subtle-1 whitespace-pre-line rounded-sm p-2">{worklog?.description}</div>
        )}
      </div>
    </div>
  );
});
