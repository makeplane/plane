// mobx
import { observer } from "mobx-react-lite";
// components
import { HeaderGroupByCard } from "./group-by-card";
// store
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";

export interface ILabelHeader {
  column_id: string;
  issues_count: number;
}

const Icon = ({ color }: any) => (
  <div className="w-[12px] h-[12px] rounded-full" style={{ backgroundColor: color ? color : "#666" }} />
);

export const LabelHeader: React.FC<ILabelHeader> = observer(({ column_id, issues_count }) => {
  const { project: projectStore }: RootStore = useMobxStore();

  const label = (column_id && projectStore?.getProjectLabelById(column_id)) ?? null;

  return <>{label && <HeaderGroupByCard icon={<Icon />} title={label?.name || ""} count={issues_count} />}</>;
});
