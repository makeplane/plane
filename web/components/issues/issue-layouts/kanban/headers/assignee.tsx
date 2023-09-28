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
  sub_group_by: string | null;
  group_by: string | null;
  header_type: "group_by" | "sub_group_by";
  issues_count: number;
}

export const AssigneesHeader: React.FC<IAssigneesHeader> = observer(
  ({ column_id, sub_group_by, group_by, header_type, issues_count }) => {
    const { project: projectStore }: RootStore = useMobxStore();

    const assignee = (column_id && projectStore?.getProjectMemberByUserId(column_id)) ?? null;

    return (
      <>
        {assignee &&
          (sub_group_by && header_type === "sub_group_by" ? (
            <HeaderSubGroupByCard
              column_id={column_id}
              title={assignee?.member?.display_name || ""}
              count={issues_count}
            />
          ) : (
            <HeaderGroupByCard
              sub_group_by={sub_group_by}
              group_by={group_by}
              column_id={column_id}
              title={assignee?.member?.display_name || ""}
              count={issues_count}
            />
          ))}
      </>
    );
  }
);
