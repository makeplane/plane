// mobx
import { observer } from "mobx-react-lite";
// components
import { HeaderGroupByCard } from "./group-by-card";
import { HeaderSubGroupByCard } from "./sub-group-by-card";
import { Icon } from "./assignee";
// store
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";

export interface ICreatedByHeader {
  column_id: string;
  sub_group_by: string | null;
  group_by: string | null;
  header_type: "group_by" | "sub_group_by";
  issues_count: number;
  kanBanToggle: any;
  handleKanBanToggle: any;
}

export const CreatedByHeader: React.FC<ICreatedByHeader> = observer(
  ({ column_id, sub_group_by, group_by, header_type, issues_count, kanBanToggle, handleKanBanToggle }) => {
    const { project: projectStore }: RootStore = useMobxStore();

    const createdBy = (column_id && projectStore?.getProjectMemberByUserId(column_id)) ?? null;

    return (
      <>
        {createdBy &&
          (sub_group_by && header_type === "sub_group_by" ? (
            <HeaderSubGroupByCard
              column_id={column_id}
              icon={<Icon user={createdBy?.member} />}
              title={createdBy?.member?.display_name || ""}
              count={issues_count}
              kanBanToggle={kanBanToggle}
              handleKanBanToggle={handleKanBanToggle}
            />
          ) : (
            <HeaderGroupByCard
              sub_group_by={sub_group_by}
              group_by={group_by}
              column_id={column_id}
              icon={<Icon user={createdBy?.member} />}
              title={createdBy?.member?.display_name || ""}
              count={issues_count}
              kanBanToggle={kanBanToggle}
              handleKanBanToggle={handleKanBanToggle}
            />
          ))}
      </>
    );
  }
);
