// mobx
import { observer } from "mobx-react-lite";
// components
import { HeaderGroupByCard } from "./group-by-card";
import { HeaderSubGroupByCard } from "./sub-group-by-card";
import { Icon } from "./state-group";
// store
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";

export interface IStateHeader {
  column_id: string;
  sub_group_by: string | null;
  group_by: string | null;
  header_type: "group_by" | "sub_group_by";
  issues_count: number;
  kanBanToggle: any;
  handleKanBanToggle: any;
}

export const StateHeader: React.FC<IStateHeader> = observer(
  ({ column_id, sub_group_by, group_by, header_type, issues_count, kanBanToggle, handleKanBanToggle }) => {
    const { project: projectStore }: RootStore = useMobxStore();

    const state = (column_id && projectStore?.getProjectStateById(column_id)) ?? null;

    return (
      <>
        {state &&
          (sub_group_by && header_type === "sub_group_by" ? (
            <HeaderSubGroupByCard
              column_id={column_id}
              icon={<Icon stateGroup={state?.group} color={state?.color} />}
              title={state?.name || ""}
              count={issues_count}
              kanBanToggle={kanBanToggle}
              handleKanBanToggle={handleKanBanToggle}
            />
          ) : (
            <HeaderGroupByCard
              sub_group_by={sub_group_by}
              group_by={group_by}
              column_id={column_id}
              icon={<Icon stateGroup={state?.group} color={state?.color} />}
              title={state?.name || ""}
              count={issues_count}
              kanBanToggle={kanBanToggle}
              handleKanBanToggle={handleKanBanToggle}
            />
          ))}
      </>
    );
  }
);
