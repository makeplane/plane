import { observer } from "mobx-react";
// plane constants
import { EIssueLayoutTypes } from "@plane/types";
import {
  CalendarLayoutLoader,
  GanttLayoutLoader,
  KanbanLayoutLoader,
  ListLayoutLoader,
  SpreadsheetLayoutLoader,
} from "@/components/ui";
import { useIssues } from "@/hooks/store";
import { useIssueStoreType } from "@/hooks/use-issue-layout-store";
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
  layout: EIssueLayoutTypes;
}

export const IssueLayoutHOC = observer((props: Props) => {
  const { layout } = props;

  const storeType = useIssueStoreType();
  const { issues } = useIssues(storeType);

  const issueCount = issues.getGroupIssueCount(undefined, undefined, false);

  if (issues?.getIssueLoader() === "init-loader" || issueCount === undefined) {
    return <ActiveLoader layout={layout} />;
  }

  if (issues.getGroupIssueCount(undefined, undefined, false) === 0 && layout !== EIssueLayoutTypes.CALENDAR) {
    return <IssueLayoutEmptyState storeType={storeType} />;
  }

  return <>{props.children}</>;
});
