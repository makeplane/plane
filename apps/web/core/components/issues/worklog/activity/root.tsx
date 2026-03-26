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
import { WorklogBlock, TimelineTimestamp } from "@plane/blocks/activity";
import { Avatar } from "@plane/propel/avatar";
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

export type IssueActivityWorklogProps = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  activityComment: TIssueActivityComment;
  ends?: "top" | "bottom";
};

export const IssueActivityWorklog = observer(function IssueActivityWorklog(props: IssueActivityWorklogProps) {
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

  const avatarElement = (
    <Avatar
      name={currentUser?.member?.display_name}
      src={currentUser?.member?.avatar_url ? getFileURL(currentUser.member.avatar_url) : undefined}
      size={14}
      shape="square"
    />
  );

  const actionsElement = (
    <>
      <div className="absolute right-0 bottom-0">
        <Popover
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
    </>
  );

  return (
    <WorklogBlock
      avatar={avatarElement}
      badgeIcon={<Timer className="w-2 h-2 text-secondary" />}
      actionsElement={actionsElement}
      description={worklog?.description}
      ends={ends}
    >
      <Link
        href={`/${workspaceSlug}/profile/${currentUser?.member?.id}`}
        className="hover:underline text-primary font-medium"
      >
        {currentUser?.member?.display_name}
      </Link>
      <span className="text-secondary">{` logged `}</span>
      <span className="text-primary font-medium">{`${convertMinutesToHoursMinutesString(worklog?.duration || 0)}.`}</span>
      {worklog.created_at && (
        <TimelineTimestamp
          timestamp={calculateTimeAgo(worklog.created_at)}
          tooltipContent={`${renderFormattedDate(worklog.created_at)}, ${renderFormattedTime(worklog.created_at)}`}
          isMobile={isMobile}
        />
      )}
    </WorklogBlock>
  );
});
