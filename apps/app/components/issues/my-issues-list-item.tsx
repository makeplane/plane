import React, { useCallback } from "react";

import Link from "next/link";
import { useRouter } from "next/router";

import { mutate } from "swr";

// hooks
import useToast from "hooks/use-toast";
import useUserAuth from "hooks/use-user-auth";
// services
import issuesService from "services/issues.service";
// components
import {
  ViewDueDateSelect,
  ViewPrioritySelect,
  ViewStateSelect,
} from "components/issues/view-select";
// icon
import { LinkIcon, PaperClipIcon } from "@heroicons/react/24/outline";
import { LayerDiagonalIcon } from "components/icons";
// ui
import { AssigneesList } from "components/ui/avatar";
import { CustomMenu, Tooltip } from "components/ui";
// types
import { IIssue, Properties } from "types";
// helper
import { copyTextToClipboard, truncateText } from "helpers/string.helper";
// fetch-keys
import { USER_ISSUE } from "constants/fetch-keys";

type Props = {
  issue: IIssue;
  properties: Properties;
  projectId: string;
};

export const MyIssuesListItem: React.FC<Props> = ({ issue, properties, projectId }) => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { user } = useUserAuth();

  const { setToastAlert } = useToast();

  const partialUpdateIssue = useCallback(
    (formData: Partial<IIssue>, issue: IIssue) => {
      if (!workspaceSlug) return;

      mutate<IIssue[]>(
        USER_ISSUE(workspaceSlug as string),
        (prevData) =>
          prevData?.map((p) => {
            if (p.id === issue.id) return { ...p, ...formData };

            return p;
          }),
        false
      );

      issuesService
        .patchIssue(workspaceSlug as string, projectId as string, issue.id, formData, user)
        .then((res) => {
          mutate(USER_ISSUE(workspaceSlug as string));
        })
        .catch((error) => {
          console.log(error);
        });
    },
    [workspaceSlug, projectId, user]
  );

  const handleCopyText = () => {
    const originURL =
      typeof window !== "undefined" && window.location.origin ? window.location.origin : "";
    copyTextToClipboard(
      `${originURL}/${workspaceSlug}/projects/${projectId}/issues/${issue.id}`
    ).then(() => {
      setToastAlert({
        type: "success",
        title: "Link Copied!",
        message: "Issue link copied to clipboard.",
      });
    });
  };

  const isNotAllowed = false;

  return (
    <div className="border-b border-custom-border-100 bg-custom-background-100 px-4 py-2.5 last:border-b-0">
      <div key={issue.id} className="flex items-center justify-between gap-2">
        <Link href={`/${workspaceSlug}/projects/${issue?.project_detail?.id}/issues/${issue.id}`}>
          <a className="group relative flex items-center gap-2">
            {properties?.key && (
              <Tooltip
                tooltipHeading="Issue ID"
                tooltipContent={`${issue.project_detail?.identifier}-${issue.sequence_id}`}
              >
                <span className="flex-shrink-0 text-xs text-custom-text-200">
                  {issue.project_detail?.identifier}-{issue.sequence_id}
                </span>
              </Tooltip>
            )}
            <Tooltip position="top-left" tooltipHeading="Title" tooltipContent={issue.name}>
              <span className="text-[0.825rem] text-custom-text-100">
                {truncateText(issue.name, 50)}
              </span>
            </Tooltip>
          </a>
        </Link>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {properties.priority && (
            <ViewPrioritySelect
              issue={issue}
              partialUpdateIssue={partialUpdateIssue}
              user={user}
              isNotAllowed={isNotAllowed}
            />
          )}
          {properties.state && (
            <ViewStateSelect
              issue={issue}
              partialUpdateIssue={partialUpdateIssue}
              user={user}
              isNotAllowed={isNotAllowed}
            />
          )}
          {properties.due_date && (
            <ViewDueDateSelect
              issue={issue}
              partialUpdateIssue={partialUpdateIssue}
              user={user}
              isNotAllowed={isNotAllowed}
            />
          )}
          {properties.labels && issue.label_details.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {issue.label_details.map((label) => (
                <span
                  key={label.id}
                  className="group flex items-center gap-1 rounded-2xl border border-custom-border-100 px-2 py-0.5 text-xs text-custom-text-200"
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{
                      backgroundColor: label?.color && label.color !== "" ? label.color : "#000",
                    }}
                  />
                  {label.name}
                </span>
              ))}
            </div>
          ) : (
            ""
          )}
          {properties.assignee && (
            <div className="flex cursor-default items-center rounded-md border border-custom-border-100 px-2 py-1 text-xs shadow-sm">
              <Tooltip
                position="top-right"
                tooltipHeading="Assignees"
                tooltipContent={
                  issue.assignee_details.length > 0
                    ? issue.assignee_details
                        .map((assignee) =>
                          assignee?.first_name !== "" ? assignee?.first_name : assignee?.email
                        )
                        .join(", ")
                    : "No Assignee"
                }
              >
                <div className="flex h-4 items-center gap-1">
                  <AssigneesList userIds={issue.assignees ?? []} />
                </div>
              </Tooltip>
            </div>
          )}
          {properties.sub_issue_count && (
            <div className="flex cursor-default items-center rounded-md border border-custom-border-100 px-2.5 py-1 text-xs shadow-sm">
              <Tooltip tooltipHeading="Sub-issue" tooltipContent={`${issue.sub_issues_count}`}>
                <div className="flex items-center gap-1 text-custom-text-200">
                  <LayerDiagonalIcon className="h-3.5 w-3.5" />
                  {issue.sub_issues_count}
                </div>
              </Tooltip>
            </div>
          )}
          {properties.link && (
            <div className="flex cursor-default items-center rounded-md border border-custom-border-100 px-2 py-1 text-xs shadow-sm">
              <Tooltip tooltipHeading="Link" tooltipContent={`${issue.link_count}`}>
                <div className="flex items-center gap-1 text-custom-text-200">
                  <LinkIcon className="h-3.5 w-3.5 text-custom-text-200" />
                  {issue.link_count}
                </div>
              </Tooltip>
            </div>
          )}
          {properties.attachment_count && (
            <div className="flex cursor-default items-center rounded-md border border-custom-border-100 px-2 py-1 text-xs shadow-sm">
              <Tooltip tooltipHeading="Attachment" tooltipContent={`${issue.attachment_count}`}>
                <div className="flex items-center gap-1 text-custom-text-200">
                  <PaperClipIcon className="h-3.5 w-3.5 -rotate-45 text-custom-text-200" />
                  {issue.attachment_count}
                </div>
              </Tooltip>
            </div>
          )}
          <CustomMenu width="auto" ellipsis>
            <CustomMenu.MenuItem onClick={handleCopyText}>
              <span className="flex items-center justify-start gap-2">
                <LinkIcon className="h-4 w-4" />
                <span>Copy issue link</span>
              </span>
            </CustomMenu.MenuItem>
          </CustomMenu>
        </div>
      </div>
    </div>
  );
};
