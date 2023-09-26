// components
import { HeaderCard } from "./card";
// mobx
import { observer } from "mobx-react-lite";
// store
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";

export interface ICreatedByHeader {
  column_id: string;
}

export const CreatedByHeader: React.FC<ICreatedByHeader> = observer(({ column_id }) => {
  const { project: projectStore }: RootStore = useMobxStore();

  const createdBy = (column_id && projectStore?.getProjectMemberById(column_id)) ?? null;

  return <>{createdBy && <HeaderCard title={createdBy?.member?.display_name || ""} />}</>;
});
