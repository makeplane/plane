import { List, Kanban, Calendar, Sheet, GanttChartSquare, LucideProps } from "lucide-react";
import { EIssueLayoutTypes } from "@plane/types";

export const IssueLayoutIcon = ({ layout, ...props }: { layout: EIssueLayoutTypes } & LucideProps) => {
  switch (layout) {
    case EIssueLayoutTypes.LIST:
      return <List {...props} />;
    case EIssueLayoutTypes.KANBAN:
      return <Kanban {...props} />;
    case EIssueLayoutTypes.CALENDAR:
      return <Calendar {...props} />;
    case EIssueLayoutTypes.SPREADSHEET:
      return <Sheet {...props} />;
    case EIssueLayoutTypes.GANTT:
      return <GanttChartSquare {...props} />;
    default:
      return null;
  }
};
