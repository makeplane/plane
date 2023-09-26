// components
import { HeaderCard } from "./card";
// mobx
import { observer } from "mobx-react-lite";
// store
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";

export interface IStateHeader {
  column_id: string;
}

export const StateHeader: React.FC<IStateHeader> = observer(({ column_id }) => {
  const { project: projectStore }: RootStore = useMobxStore();

  const state = (column_id && projectStore?.getProjectStateById(column_id)) ?? null;

  return <>{state && <HeaderCard title={state?.name || ""} />}</>;
});
