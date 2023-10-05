import React from "react";

// types
import { ICurrentUserResponse, IIssue, Properties } from "types";
// helper
import { renderLongDetailDateFormat } from "helpers/date-time.helper";

type Props = {
  issue: IIssue;
  projectId: string;
  partialUpdateIssue: (formData: Partial<IIssue>, issue: IIssue) => void;
  properties: Properties;
  user: ICurrentUserResponse | undefined;
  isNotAllowed: boolean;
};

export const CreatedOnColumn: React.FC<Props> = ({
  issue,
  projectId,
  partialUpdateIssue,
  properties,
  user,
  isNotAllowed,
}) => (
  <div className="flex items-center text-sm h-11 w-full bg-custom-background-100">
    <span className="flex items-center px-4 py-2.5 h-full w-full flex-shrink-0 border-r border-b border-custom-border-100">
      {properties.created_on && (
        <div className="flex items-center text-xs cursor-default text-custom-text-200 text-center p-2 group-hover:bg-custom-background-80 border-custom-border-200">
          {renderLongDetailDateFormat(issue.created_at)}
        </div>
      )}
    </span>
  </div>
);
