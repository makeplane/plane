import React from "react";

// components
import { ViewDueDateSelect } from "components/issues";
// types
import { ICurrentUserResponse, IIssue, Properties } from "types";

type Props = {
  issue: IIssue;
  projectId: string;
  partialUpdateIssue: (formData: Partial<IIssue>, issue: IIssue) => void;
  properties: Properties;
  user: ICurrentUserResponse | undefined;
  isNotAllowed: boolean;
};

export const DueDateColumn: React.FC<Props> = ({
  issue,
  projectId,
  partialUpdateIssue,
  properties,
  user,
  isNotAllowed,
}) => (
  <div className="flex items-center text-sm h-11 w-full bg-custom-background-100">
    <span className="flex items-center px-4 py-2.5 h-full w-full flex-shrink-0 border-r border-b border-custom-border-200">
      {properties.due_date && (
        <ViewDueDateSelect
          issue={issue}
          partialUpdateIssue={partialUpdateIssue}
          noBorder
          user={user}
          isNotAllowed={isNotAllowed}
        />
      )}
    </span>
  </div>
);
