// components
import { HeaderGroupByCard } from "./group-by-card";
import { HeaderSubGroupByCard } from "./sub-group-by-card";
// mobx
import { observer } from "mobx-react-lite";
// store
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";

export interface ILabelHeader {
  column_id: string;
  type?: "group_by" | "sub_group_by";
}

export const LabelHeader: React.FC<ILabelHeader> = observer(({ column_id, type }) => {
  const { project: projectStore, issueFilter: issueFilterStore }: RootStore = useMobxStore();

  const label = (column_id && projectStore?.getProjectLabelById(column_id)) ?? null;
  const sub_group_by = issueFilterStore?.userDisplayFilters?.sub_group_by ?? null;

  return (
    <>
      {label &&
        (sub_group_by && type === "sub_group_by" ? (
          <HeaderSubGroupByCard title={label?.name || ""} />
        ) : (
          <HeaderGroupByCard title={label?.name || ""} />
        ))}
    </>
  );
});
