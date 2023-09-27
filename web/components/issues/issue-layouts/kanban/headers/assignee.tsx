// components
import { HeaderGroupByCard } from "./group-by-card";
import { HeaderSubGroupByCard } from "./sub-group-by-card";
// mobx
import { observer } from "mobx-react-lite";
// store
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";

export interface IAssigneesHeader {
  column_id: string;
  type?: "group_by" | "sub_group_by";
}

export const AssigneesHeader: React.FC<IAssigneesHeader> = observer(({ column_id, type }) => {
  const { project: projectStore, issueFilter: issueFilterStore }: RootStore = useMobxStore();

  const assignee = (column_id && projectStore?.getProjectMemberByUserId(column_id)) ?? null;
  const sub_group_by = issueFilterStore?.userDisplayFilters?.sub_group_by ?? null;

  return (
    <>
      {assignee &&
        (sub_group_by && type === "sub_group_by" ? (
          <HeaderSubGroupByCard title={assignee?.member?.display_name || ""} />
        ) : (
          <HeaderGroupByCard title={assignee?.member?.display_name || ""} />
        ))}
    </>
  );
});
