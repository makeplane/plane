// components
import { StateHeader } from "./state";
import { StateGroupHeader } from "./state-group";
import { AssigneesHeader } from "./assignee";
import { PriorityHeader } from "./priority";
import { LabelHeader } from "./label";
import { CreatedByHeader } from "./created_by";
// mobx
import { observer } from "mobx-react-lite";

export interface IKanBanGroupByHeaderRoot {
  column_id: string;
  group_by: string | null;
  issues_count: number;
}

export const KanBanGroupByHeaderRoot: React.FC<IKanBanGroupByHeaderRoot> = observer(
  ({ column_id, group_by, issues_count }) => (
    <>
      {group_by && group_by === "state" && <StateHeader column_id={column_id} issues_count={issues_count} />}
      {group_by && group_by === "state_detail.group" && (
        <StateGroupHeader column_id={column_id} issues_count={issues_count} />
      )}
      {group_by && group_by === "priority" && <PriorityHeader column_id={column_id} issues_count={issues_count} />}
      {group_by && group_by === "labels" && <LabelHeader column_id={column_id} issues_count={issues_count} />}
      {group_by && group_by === "assignees" && <AssigneesHeader column_id={column_id} issues_count={issues_count} />}
      {group_by && group_by === "created_by" && <CreatedByHeader column_id={column_id} issues_count={issues_count} />}
    </>
  )
);
