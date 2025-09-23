"use client";

import { FC } from "react";
import { Avatar, Table } from "@plane/ui";
// helpers
import { convertMinutesToHoursMinutesString, getFileURL, renderFormattedDate } from "@plane/utils";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { useProject } from "@/hooks/store/use-project";
// plane web hooks
import { useWorkspaceWorklogs } from "@/plane-web/hooks/store";
// plane web types
import { TWorklog } from "@/plane-web/types";

export type TWorklogsPaginatedTableRoot = {
  workspaceSlug: string;
  workspaceId: string;
};

export const WorklogsPaginatedTableRoot: FC<TWorklogsPaginatedTableRoot> = (props) => {
  const {} = props;
  // hooks
  const { getProjectById } = useProject();
  const {
    workspace: { getWorkspaceMemberDetails },
  } = useMember();
  const { currentPaginatedKey, paginatedWorklogIds, worklogById } = useWorkspaceWorklogs();

  // derived values
  const worklogIds = currentPaginatedKey ? paginatedWorklogIds[currentPaginatedKey] : [];
  const worklogTableData = worklogIds.map((worklogId) => worklogById(worklogId)) as TWorklog[];

  const tableColumns = [
    {
      key: "project",
      content: "Project",
      tdRender: (rowData: TWorklog) => {
        const currentProject = (rowData.project_id && getProjectById(rowData.project_id)) || undefined;
        return <div className="truncate w-[200px]">{currentProject?.name}</div>;
      },
    },
    {
      key: "issue",
      content: "Work item",
      tdRender: (rowData: TWorklog) => {
        const currentProject = (rowData.project_id && getProjectById(rowData.project_id)) || undefined;
        return (
          <div className="flex items-center gap-2">
            <div className="text-xs text-custom-text-200">
              {currentProject?.identifier}-{rowData.issue_detail?.sequence_id}
            </div>
            <div className="text-custom-text-100">{rowData.issue_detail?.name || "undefined"}</div>
          </div>
        );
      },
    },
    {
      key: "logged",
      content: "Logged",
      tdRender: (rowData: TWorklog) => {
        const currentUser = (rowData.logged_by && getWorkspaceMemberDetails(rowData.logged_by)) || undefined;
        return (
          <div className="flex items-center gap-2">
            <Avatar
              name={currentUser?.member?.display_name}
              src={getFileURL(currentUser?.member?.avatar_url ?? "")}
              shape="circle"
              size="sm"
              showTooltip={false}
            />
            <span className="flex-grow truncate">
              {currentUser?.member?.display_name} on {renderFormattedDate(rowData?.created_at)}
            </span>
          </div>
        );
      },
    },
    {
      key: "tile",
      content: "Time",
      tdRender: (rowData: TWorklog) => (
        <div className="font-medium">{rowData.duration && convertMinutesToHoursMinutesString(rowData.duration)}</div>
      ),
    },
  ];

  return (
    <div className="overflow-x-auto">
      <Table
        columns={tableColumns}
        data={worklogTableData}
        keyExtractor={(rowData: TWorklog) => rowData.id || ""}
        tHeadClassName="border-b border-custom-border-100"
        thClassName="text-left font-medium divide-x-0 text-custom-text-400"
        tBodyClassName="divide-y-0"
        tBodyTrClassName="divide-x-0 p-2 h-[40px] text-custom-text-200"
        tHeadTrClassName="divide-x-0"
      />
    </div>
  );
};
