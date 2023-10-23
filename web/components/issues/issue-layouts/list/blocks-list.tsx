import { FC } from "react";
// components
import { IssueBlock } from "components/issues";
// types
import { IIssue } from "types";

interface Props {
  columnId: string;
  issues: IIssue[];
  handleIssues: (group_by: string | null, issue: IIssue, action: "update" | "delete") => void;
  quickActions: (group_by: string | null, issue: IIssue) => React.ReactNode;
  display_properties: any;
  states: any;
  labels: any;
  members: any;
  priorities: any;
}

export const IssueBlocksList: FC<Props> = (props) => {
  const { columnId, issues, handleIssues, quickActions, display_properties, states, labels, members, priorities } =
    props;

  return (
    <>
      {issues &&
        issues?.length > 0 &&
        issues.map((issue) => (
          <IssueBlock
            key={issue.id}
            columnId={columnId}
            issue={issue}
            handleIssues={handleIssues}
            quickActions={quickActions}
            display_properties={display_properties}
            states={states}
            labels={labels}
            members={members}
            priorities={priorities}
          />
        ))}
    </>
  );
};
