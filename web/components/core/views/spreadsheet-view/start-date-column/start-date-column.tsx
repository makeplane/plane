import React from "react";

// components
import { ViewStartDateSelect } from "components/issues";
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

export const StartDateColumn: React.FC<Props> = ({
  issue,
  projectId,
  partialUpdateIssue,
  properties,
  user,
  isNotAllowed,
}) => (
  <div className="flex items-center text-sm h-11 w-full bg-custom-background-100">
    <span className="flex items-center px-4 py-2.5 h-full w-full flex-shrink-0 border-r border-b border-custom-border-100">
      {properties.due_date && (
        <ViewStartDateSelect
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
