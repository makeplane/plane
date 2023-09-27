// components
import { StateHeader } from "./state";
import { StateGroupHeader } from "./state-group";
import { AssigneesHeader } from "./assignee";
import { PriorityHeader } from "./priority";
import { LabelHeader } from "./label";
import { CreatedByHeader } from "./created_by";
// mobx
import { observer } from "mobx-react-lite";
// mobx
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";

export interface IKanBanGroupByHeaderRoot {
  column_id: string;
}

export const KanBanGroupByHeaderRoot: React.FC<IKanBanGroupByHeaderRoot> = observer(({ column_id }) => {
  const { issueFilter: issueFilterStore }: RootStore = useMobxStore();
  const group_by: string | null = issueFilterStore?.userDisplayFilters?.group_by || null;

  return (
    <>
      {group_by && group_by === "state" && <StateHeader column_id={column_id} type={`group_by`} />}
      {group_by && group_by === "state_detail.group" && <StateGroupHeader column_id={column_id} type={`group_by`} />}
      {group_by && group_by === "priority" && <PriorityHeader column_id={column_id} type={`group_by`} />}
      {group_by && group_by === "labels" && <LabelHeader column_id={column_id} type={`group_by`} />}
      {group_by && group_by === "assignees" && <AssigneesHeader column_id={column_id} type={`group_by`} />}
      {group_by && group_by === "created_by" && <CreatedByHeader column_id={column_id} type={`group_by`} />}
    </>
  );
});
