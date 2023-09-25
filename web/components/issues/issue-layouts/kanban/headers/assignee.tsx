// components
import { HeaderCard } from "./card";
// mobx
import { observer } from "mobx-react-lite";
// store
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";

export interface IAssigneesHeader {
  column_id: string;
}

export const AssigneesHeader: React.FC<IAssigneesHeader> = observer(({ column_id }) => {
  const { project: projectStore }: RootStore = useMobxStore();

  const assignee = (column_id && projectStore?.getProjectMemberById(column_id)) ?? null;

  return <>{assignee && <HeaderCard title={assignee?.member?.display_name || ""} />}</>;
});
