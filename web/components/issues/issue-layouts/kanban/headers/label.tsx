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
  sub_group_by: string | null;
  group_by: string | null;
  header_type: "group_by" | "sub_group_by";
  issues_count: number;
}

export const LabelHeader: React.FC<ILabelHeader> = observer(
  ({ column_id, sub_group_by, group_by, header_type, issues_count }) => {
    const { project: projectStore }: RootStore = useMobxStore();

    const label = (column_id && projectStore?.getProjectLabelById(column_id)) ?? null;

    return (
      <>
        {label &&
          (sub_group_by && header_type === "sub_group_by" ? (
            <HeaderSubGroupByCard title={label?.name || ""} column_id={column_id} count={issues_count} />
          ) : (
            <HeaderGroupByCard
              sub_group_by={sub_group_by}
              group_by={group_by}
              column_id={column_id}
              title={label?.name || ""}
              count={issues_count}
            />
          ))}
      </>
    );
  }
);
