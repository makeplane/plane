import { observer } from "mobx-react-lite";
// components
import { HeaderGroupByCard } from "./group-by-card";

export interface IEmptyHeader {
  column_id: string;
  column_value: any;
  issues_count: number;
}

export const EmptyHeader: React.FC<IEmptyHeader> = observer((props) => {
  const { column_id, column_value, issues_count } = props;

  return <HeaderGroupByCard title={column_value?.title || "All Issues"} count={issues_count} />;
});
