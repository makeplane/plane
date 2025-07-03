import { List, Kanban, LucideProps } from "lucide-react";
import { TIssueLayout } from "@plane/constants";

export const IssueLayoutIcon = ({ layout, ...props }: { layout: TIssueLayout } & LucideProps) => {
  switch (layout) {
    case "list":
      return <List {...props} />;
    case "kanban":
      return <Kanban {...props} />;
    default:
      return null;
  }
};
