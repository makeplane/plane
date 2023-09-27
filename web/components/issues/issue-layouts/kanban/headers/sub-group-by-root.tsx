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

export interface IKanBanSubGroupByHeaderRoot {
  column_id: string;
}

export const KanBanSubGroupByHeaderRoot: React.FC<IKanBanSubGroupByHeaderRoot> = observer(({ column_id }) => {
  const { issueFilter: issueFilterStore }: RootStore = useMobxStore();
  const sub_group_by: string | null = issueFilterStore?.userDisplayFilters?.sub_group_by || null;

  return (
    <>
      {sub_group_by && sub_group_by === "state" && <StateHeader column_id={column_id} type={`sub_group_by`} />}
      {sub_group_by && sub_group_by === "state_detail.group" && (
        <StateGroupHeader column_id={column_id} type={`sub_group_by`} />
      )}
      {sub_group_by && sub_group_by === "priority" && <PriorityHeader column_id={column_id} type={`sub_group_by`} />}
      {sub_group_by && sub_group_by === "labels" && <LabelHeader column_id={column_id} type={`sub_group_by`} />}
      {sub_group_by && sub_group_by === "assignees" && <AssigneesHeader column_id={column_id} type={`sub_group_by`} />}
      {sub_group_by && sub_group_by === "created_by" && <CreatedByHeader column_id={column_id} type={`sub_group_by`} />}
    </>
  );
});
