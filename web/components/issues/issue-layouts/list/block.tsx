// components
import { KanBanProperties } from "./properties";

interface IssueBlockProps {
  columnId: string;
  issues: any;
  handleIssues?: (group_by: string | null, issue: any) => void;
  display_properties: any;
}

export const IssueBlock = ({ columnId, issues, handleIssues, display_properties }: IssueBlockProps) => (
  <>
    {issues && issues.length > 0 ? (
      <>
        {issues.map((issue: any, index: any) => (
          <div
            key={index}
            className={`text-sm p-3 shadow-custom-shadow-2xs transition-all bg-custom-background-100 flex items-center flex-wrap gap-3 border-b border-custom-border-200`}
          >
            {display_properties && display_properties?.key && (
              <div className="flex-shrink-0 text-xs text-custom-text-300">ONE-{issue.sequence_id}</div>
            )}
            <div className="line-clamp-1 text-sm font-medium text-custom-text-100">{issue.name}</div>
            <div className="ml-auto flex-shrink-0">
              <KanBanProperties
                columnId={columnId}
                issue={issue}
                handleIssues={handleIssues}
                display_properties={display_properties}
              />
            </div>
          </div>
        ))}
      </>
    ) : (
      <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
        No issues are available
      </div>
    )}
  </>
);
