import { FC } from "react";
// components
import { KanBanProperties } from "./properties";
// ui
import { Tooltip } from "@plane/ui";

interface IssueBlockProps {
  columnId: string;
  issues: any;
  handleIssues?: (group_by: string | null, issue: any) => void;
  display_properties: any;
  states: any;
  labels: any;
  members: any;
  priorities: any;
}

export const IssueBlock: FC<IssueBlockProps> = (props) => {
  const { columnId, issues, handleIssues, display_properties, states, labels, members, priorities } = props;

  return (
    <>
      {issues &&
        issues?.length > 0 &&
        issues.map((issue: any, index: any) => (
          <div
            key={index}
            className={`text-sm p-3 shadow-custom-shadow-2xs transition-all bg-custom-background-100 flex items-center gap-3 border-b border-custom-border-200`}
          >
            {display_properties && display_properties?.key && (
              <div className="flex-shrink-0 text-xs text-custom-text-300">ONE-{issue.sequence_id}</div>
            )}
            <Tooltip tooltipHeading="Title" tooltipContent={issue.name}>
              <div className="line-clamp-1 text-sm font-medium text-custom-text-100">{issue.name}</div>
            </Tooltip>
            <div className="ml-auto flex-shrink-0">
              <KanBanProperties
                columnId={columnId}
                issue={issue}
                handleIssues={handleIssues}
                display_properties={display_properties}
                states={states}
                labels={labels}
                members={members}
                priorities={priorities}
              />
            </div>
          </div>
        ))}
    </>
  );
};
