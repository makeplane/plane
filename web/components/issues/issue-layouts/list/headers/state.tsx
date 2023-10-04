// mobx
import { observer } from "mobx-react-lite";
// components
import { HeaderGroupByCard } from "./group-by-card";
import { Icon } from "./state-group";
// store
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";

export interface IStateHeader {
  column_id: string;
  issues_count: number;
}

export const StateHeader: React.FC<IStateHeader> = observer(({ column_id, issues_count }) => {
  const { project: projectStore }: RootStore = useMobxStore();

  const state = (column_id && projectStore?.getProjectStateById(column_id)) ?? null;

  return (
    <>
      {state && (
        <HeaderGroupByCard
          icon={<Icon stateGroup={state?.group} color={state?.color} />}
          title={state?.name || ""}
          count={issues_count}
        />
      )}
    </>
  );
});
