import type { FC } from "react";
import React, { useRef, useState } from "react";
import { omit } from "lodash-es";
import { observer } from "mobx-react";
import { SquareStackIcon } from "lucide-react";
import { CopyIcon, EditIcon, TrashIcon } from "@plane/propel/icons";
// plane utils
import { Tooltip } from "@plane/propel/tooltip";
import type { TWorkspaceDraftIssue } from "@plane/types";
import { EIssuesStoreType } from "@plane/types";
import type { TContextMenuItem } from "@plane/ui";
import { Row } from "@plane/ui";
import { cn } from "@plane/utils";
// hooks
import { useAppTheme } from "@/hooks/store/use-app-theme";
import { useProject } from "@/hooks/store/use-project";
import { useWorkspaceDraftIssues } from "@/hooks/store/workspace-draft";
// plane-web imports
import { IssueTypeIdentifier } from "@/plane-web/components/issues/issue-details/issue-identifier";
// local imports
import { IdentifierText } from "../issue-detail/identifier-text";
import { CreateUpdateIssueModal } from "../issue-modal/modal";
import { WorkspaceDraftIssueDeleteIssueModal } from "./delete-modal";
import { DraftIssueProperties } from "./draft-issue-properties";
import { WorkspaceDraftIssueQuickActions } from "./quick-action";

type Props = {
  workspaceSlug: string;
  issueId: string;
};

export const DraftIssueBlock = observer(function DraftIssueBlock(props: Props) {
  // props
  const { workspaceSlug, issueId } = props;
  // states
  const [moveToIssue, setMoveToIssue] = useState(false);
  const [createUpdateIssueModal, setCreateUpdateIssueModal] = useState(false);
  const [issueToEdit, setIssueToEdit] = useState<TWorkspaceDraftIssue | undefined>(undefined);
  const [deleteIssueModal, setDeleteIssueModal] = useState(false);
  // hooks
  const { getIssueById, updateIssue, deleteIssue } = useWorkspaceDraftIssues();
  const { sidebarCollapsed: isSidebarCollapsed } = useAppTheme();
  const { getProjectIdentifierById } = useProject();
  // ref
  const issueRef = useRef<HTMLDivElement | null>(null);
  // derived values
  const issue = getIssueById(issueId);
  const projectIdentifier = (issue && issue.project_id && getProjectIdentifierById(issue.project_id)) || undefined;
  if (!issue || !projectIdentifier) return null;

  const duplicateIssuePayload = omit(
    {
      ...issue,
      name: `${issue.name} (copy)`,
      is_draft: true,
    },
    ["id"]
  );

  const MENU_ITEMS: TContextMenuItem[] = [
    {
      key: "edit",
      title: "edit",
      icon: EditIcon,
      action: () => {
        setIssueToEdit(issue);
        setCreateUpdateIssueModal(true);
      },
    },
    {
      key: "make-a-copy",
      title: "make_a_copy",
      icon: CopyIcon,
      action: () => {
        setCreateUpdateIssueModal(true);
      },
    },
    {
      key: "move-to-issues",
      title: "move_to_project",
      icon: SquareStackIcon,
      action: () => {
        setMoveToIssue(true);
        setIssueToEdit(issue);
        setCreateUpdateIssueModal(true);
      },
    },
    {
      key: "delete",
      title: "delete",
      icon: TrashIcon,
      action: () => {
        setDeleteIssueModal(true);
      },
    },
  ];

  return (
    <>
      <WorkspaceDraftIssueDeleteIssueModal
        data={issue}
        isOpen={deleteIssueModal}
        handleClose={() => setDeleteIssueModal(false)}
        onSubmit={async () => deleteIssue(workspaceSlug, issueId)}
      />
      <CreateUpdateIssueModal
        isOpen={createUpdateIssueModal}
        onClose={() => {
          setCreateUpdateIssueModal(false);
          setIssueToEdit(undefined);
          setMoveToIssue(false);
        }}
        data={issueToEdit ?? duplicateIssuePayload}
        onSubmit={async (data) => {
          if (issueToEdit) await updateIssue(workspaceSlug, issueId, data);
        }}
        storeType={EIssuesStoreType.WORKSPACE_DRAFT}
        fetchIssueDetails={false}
        moveToIssue={moveToIssue}
        isDraft
      />
      <div
        id={`issue-${issue.id}`}
        className=" relative border-b border-b-subtle-1 w-full cursor-pointer"
        onDoubleClick={() => {
          setIssueToEdit(issue);
          setCreateUpdateIssueModal(true);
        }}
      >
        <Row
          ref={issueRef}
          className={cn(
            "group/list-block min-h-11 relative flex flex-col gap-3 bg-layer-transparent hover:bg-layer-transparent-hover py-3 text-13 transition-colors",
            {
              "md:flex-row md:items-center": isSidebarCollapsed,
              "lg:flex-row lg:items-center": !isSidebarCollapsed,
            }
          )}
        >
          <div className="flex w-full truncate">
            <div className="flex flex-grow items-center gap-0.5 truncate">
              <div className="flex items-center gap-1">
                <div className="flex-shrink-0">
                  {issue.project_id && (
                    <div className="flex items-center space-x-2">
                      {issue?.type_id && <IssueTypeIdentifier issueTypeId={issue.type_id} />}
                      <IdentifierText
                        identifier={projectIdentifier}
                        enableClickToCopyIdentifier
                        size="xs"
                        variant="tertiary"
                      />
                    </div>
                  )}
                </div>

                {/* sub-issues chevron */}
                <div className="size-4 grid place-items-center flex-shrink-0" />
              </div>

              <Tooltip tooltipContent={issue.name} position="top-start" renderByDefault={false}>
                <p className="w-full truncate cursor-pointer text-13 text-primary">{issue.name}</p>
              </Tooltip>
            </div>

            {/* quick actions */}
            <div
              className={cn("block border border-strong rounded-sm", {
                "md:hidden": isSidebarCollapsed,
                "lg:hidden": !isSidebarCollapsed,
              })}
            >
              <WorkspaceDraftIssueQuickActions parentRef={issueRef} MENU_ITEMS={MENU_ITEMS} />
            </div>
          </div>

          <div className="flex flex-shrink-0 items-center gap-2">
            <DraftIssueProperties
              className={`relative flex flex-wrap ${isSidebarCollapsed ? "md:flex-grow md:flex-shrink-0" : "lg:flex-grow lg:flex-shrink-0"} items-center gap-2 whitespace-nowrap`}
              issue={issue}
              updateIssue={async (projectId, issueId, data) => {
                await updateIssue(workspaceSlug, issueId, data);
              }}
            />
            <div
              className={cn("hidden", {
                "md:flex": isSidebarCollapsed,
                "lg:flex": !isSidebarCollapsed,
              })}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <WorkspaceDraftIssueQuickActions parentRef={issueRef} MENU_ITEMS={MENU_ITEMS} />
            </div>
          </div>
        </Row>
      </div>
    </>
  );
});
