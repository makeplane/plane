"use client";

import { FC, useRef } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { Ellipsis, Timer } from "lucide-react";
import { TIssueActivityComment } from "@plane/types";
import { CustomMenu, Popover, Tooltip } from "@plane/ui";
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

export const IssueActivityWorklog: FC<TIssueActivityWorklog> = observer((props) => {
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
      className={`relative flex gap-3 ${ends === "top" ? `pb-2` : ends === "bottom" ? `pt-2` : `py-2`} ${!worklog?.description && "items-center"}`}
    >
      <div className="absolute left-[13px] top-0 bottom-0 w-0.5 bg-custom-background-80" aria-hidden />
      <div className="flex-shrink-0 relative w-7 h-7 rounded-full flex justify-center items-center z-10 bg-gray-500 text-white border border-white uppercase font-medium">
        {currentUser?.member?.avatar_url && currentUser?.member?.avatar_url !== "" ? (
          <img
            src={getFileURL(currentUser?.member?.avatar_url)}
            alt={currentUser?.member?.display_name}
            height={30}
            width={30}
            className="grid h-7 w-7 place-items-center rounded-full border-2 border-custom-border-200"
          />
        ) : (
          <>
            {currentUser?.member?.first_name
              ? currentUser?.member?.first_name.charAt(0)
              : currentUser?.member?.display_name?.charAt(0)}
          </>
        )}
        <div className="absolute top-2 left-4 w-5 h-5 rounded-full overflow-hidden flex justify-center items-center bg-custom-background-80">
          <Timer className="w-3 h-3 text-custom-text-200" />
        </div>
      </div>
      <div className="w-full space-y-1.5">
        <div className="w-full relative flex items-center">
          <div className="flex w-full truncate gap-1">
            <div className="text-xs">
              <Link
                href={`/${workspaceSlug}/profile/${currentUser?.member?.id}`}
                className="hover:underline text-custom-text-100 font-medium capitalize"
              >
                {currentUser?.member?.display_name}
              </Link>
              <span className="text-custom-text-300 font-medium">{` logged `}</span>
              <span className="text-custom-text-100 font-medium">{`${convertMinutesToHoursMinutesString(worklog?.duration || 0)}.`}</span>
            </div>
            {worklog.created_at && (
              <span>
                <Tooltip
                  isMobile={isMobile}
                  tooltipContent={`${renderFormattedDate(worklog.created_at)}, ${renderFormattedTime(worklog.created_at)}`}
                >
                  <div className="text-xs text-custom-text-200">{`${calculateTimeAgo(worklog.created_at)}`}</div>
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
                panelClassName="w-72 my-1 rounded border-[0.5px] border-custom-border-300 bg-custom-background-100 p-3 text-xs shadow-custom-shadow-rg focus:outline-none"
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
              className="flex flex-grow justify-center text-sm text-custom-text-200"
              placement="bottom-start"
              customButton={
                <div className="w-5 h-5 flex justify-center items-center overflow-hidden rounded hover:bg-custom-background-80 transition-all">
                  <Ellipsis className="w-3.5 h-3.5 font-medium" />
                </div>
              }
              customButtonClassName="flex flex-grow justify-center text-custom-text-200 text-sm"
              closeOnSelect
            >
              {popoverOptions.map((option) => (
                <CustomMenu.MenuItem key={option.value} onClick={option.onClick}>
                  <div className="text-custom-text-300">{option.label}</div>
                </CustomMenu.MenuItem>
              ))}
            </CustomMenu>
          </div>
        </div>
        {worklog?.description && (
          <div className="border border-custom-border-200 whitespace-pre-line rounded p-2">{worklog?.description}</div>
        )}
      </div>
    </div>
  );
});
