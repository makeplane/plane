import { FC } from "react";
// types
import { TViewOperations } from "../types";

type TViewFiltersRoot = {
  workspaceSlug: string;
  projectId: string | undefined;
  viewId: string | undefined;
  viewOperations: TViewOperations;
};

export const ViewFiltersRoot: FC<TViewFiltersRoot> = (props) => {
  const { workspaceSlug, projectId, viewId, viewOperations } = props;

  const filters = {
    project: ["1", "2", "3", "4", "5", "6"],
    priority: ["1", "2", "3", "4", "5", "6"],
    state: ["1", "2", "3", "4", "5", "6"],
    state_group: ["1", "2", "3", "4", "5", "6"],
    assignees: ["1", "2", "3", "4", "5", "6"],
    mentions: ["1", "2", "3", "4", "5", "6"],
    subscriber: ["1", "2", "3", "4", "5", "6"],
    created_by: ["1", "2", "3", "4", "5", "6"],
    labels: ["1", "2", "3", "4", "5", "6"],
    start_date: ["1", "2", "3", "4", "5", "6"],
    target_date: ["1", "2", "3", "4", "5", "6"],
  };

  return (
    <div className="border border-red-500">
      <div>ViewFiltersRoot</div>
    </div>
  );
};
