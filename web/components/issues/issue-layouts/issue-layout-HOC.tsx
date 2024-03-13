import {
  CalendarLayoutLoader,
  GanttLayoutLoader,
  KanbanLayoutLoader,
  ListLayoutLoader,
  SpreadsheetLayoutLoader,
} from "components/ui";
import { EIssueLayoutTypes, EIssuesStoreType } from "constants/issue";
import { useIssues } from "hooks/store";
import { observer } from "mobx-react";
import { IssueLayoutEmptyState } from "./empty-states";

const ActiveLoader = (props: { layout: EIssueLayoutTypes }) => {
  const { layout } = props;
  switch (layout) {
    case EIssueLayoutTypes.LIST:
      return <ListLayoutLoader />;
    case EIssueLayoutTypes.KANBAN:
      return <KanbanLayoutLoader />;
    case EIssueLayoutTypes.SPREADSHEET:
      return <SpreadsheetLayoutLoader />;
    case EIssueLayoutTypes.CALENDAR:
      return <CalendarLayoutLoader />;
    case EIssueLayoutTypes.GANTT:
      return <GanttLayoutLoader />;
    default:
      return null;
  }
};

interface Props {
  children: string | JSX.Element | JSX.Element[];
  storeType: EIssuesStoreType;
  layout: EIssueLayoutTypes;
}

export const IssueLayoutHOC = observer((props: Props) => {
  const { storeType, layout } = props;

  const { issues } = useIssues(storeType);

  if (issues?.loader === "init-loader" || !issues?.groupedIssueIds) {
    return <ActiveLoader layout={layout} />;
  }

  if (issues.issueCount === 0) {
    return <IssueLayoutEmptyState storeType={storeType} />;
  }

  return <>{props.children}</>;
});
