import type { LucideProps } from "lucide-react";
import { List, Kanban } from "lucide-react";
import type { TIssueLayout } from "@plane/constants";

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
