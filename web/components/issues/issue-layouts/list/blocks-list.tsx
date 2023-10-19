import { FC } from "react";
// components
import { IssueBlock } from "components/issues";
// types
import { IIssue } from "types";

interface Props {
  columnId: string;
  issues: IIssue[];
  handleIssues?: (group_by: string | null, issue: IIssue, action: "update" | "delete") => void;
  display_properties: any;
  states: any;
  labels: any;
  members: any;
  priorities: any;
}

export const IssueBlocksList: FC<Props> = (props) => {
  const { columnId, issues, handleIssues, display_properties, states, labels, members, priorities } = props;

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
