import { observer } from "mobx-react-lite";
// components
import { HeaderGroupByCard } from "./group-by-card";
import { EProjectStore } from "store/command-palette.store";

export interface IEmptyHeader {
  column_id: string;
  column_value: any;
  issues_count: number;
  disableIssueCreation?: boolean;
  currentStore: EProjectStore;
}

export const EmptyHeader: React.FC<IEmptyHeader> = observer((props) => {
  const { column_id, column_value, issues_count, disableIssueCreation, currentStore } = props;

  return (
    <HeaderGroupByCard
      title={column_value?.title || "All Issues"}
      count={issues_count}
      issuePayload={{}}
      disableIssueCreation={disableIssueCreation}
      currentStore={currentStore}
    />
  );
});
