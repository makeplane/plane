// components
import { HeaderGroupByCard } from "./group-by-card";
import { HeaderSubGroupByCard } from "./sub-group-by-card";
// mobx
import { observer } from "mobx-react-lite";
// store
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";

export interface IStateHeader {
  column_id: string;
  type?: "group_by" | "sub_group_by";
}

export const StateHeader: React.FC<IStateHeader> = observer(({ column_id, type }) => {
  const { project: projectStore, issueFilter: issueFilterStore }: RootStore = useMobxStore();

  const state = (column_id && projectStore?.getProjectStateById(column_id)) ?? null;
  const sub_group_by = issueFilterStore?.userDisplayFilters?.sub_group_by ?? null;

  return (
    <>
      {state &&
        (sub_group_by && type === "sub_group_by" ? (
          <HeaderSubGroupByCard title={state?.name || ""} />
        ) : (
          <HeaderGroupByCard title={state?.name || ""} />
        ))}
    </>
  );
});
