// components
import { HeaderCard } from "./card";
// mobx
import { observer } from "mobx-react-lite";
// store
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";

export interface ILabelHeader {
  column_id: string;
}

export const LabelHeader: React.FC<ILabelHeader> = observer(({ column_id }) => {
  const { project: projectStore }: RootStore = useMobxStore();

  const label = (column_id && projectStore?.getProjectLabelById(column_id)) ?? null;

  return <>{label && <HeaderCard title={label?.name || ""} />}</>;
});
