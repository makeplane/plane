// components
import { HeaderGroupByCard } from "./group-by-card";
import { HeaderSubGroupByCard } from "./sub-group-by-card";
// mobx
import { observer } from "mobx-react-lite";
// store
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";

export interface ICreatedByHeader {
  column_id: string;
  sub_group_by: string | null;
  group_by: string | null;
  header_type: "group_by" | "sub_group_by";
}

export const CreatedByHeader: React.FC<ICreatedByHeader> = observer(
  ({ column_id, sub_group_by, group_by, header_type }) => {
    const { project: projectStore }: RootStore = useMobxStore();

    const createdBy = (column_id && projectStore?.getProjectMemberByUserId(column_id)) ?? null;

    return (
      <>
        {createdBy &&
          (sub_group_by && header_type === "sub_group_by" ? (
            <HeaderSubGroupByCard title={createdBy?.member?.display_name || ""} column_id={column_id} count={0} />
          ) : (
            <HeaderGroupByCard
              sub_group_by={sub_group_by}
              group_by={group_by}
              column_id={column_id}
              title={createdBy?.member?.display_name || ""}
              count={0}
            />
          ))}
      </>
    );
  }
);
