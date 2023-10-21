import React from "react";

// components
import { LabelSelect } from "components/project";
// types
import { IUser, IIssue, Properties } from "types";

type Props = {
  issue: IIssue;
  projectId: string;
  partialUpdateIssue: (formData: Partial<IIssue>, issue: IIssue) => void;
  properties: Properties;
  user: IUser | undefined;
  isNotAllowed: boolean;
};

export const LabelColumn: React.FC<Props> = ({
  issue,
  projectId,
  partialUpdateIssue,
  properties,
  user,
  isNotAllowed,
}) => {
  const handleLabelChange = (data: any) => {
    partialUpdateIssue({ labels_list: data }, issue);
  };

  return (
    <div className="flex items-center text-sm h-11 w-full bg-custom-background-100">
      <span className="flex items-center px-4 py-2.5 h-full w-full flex-shrink-0 border-r border-b border-custom-border-100">
        {properties.labels && (
          <LabelSelect
            value={issue.labels}
            projectId={projectId}
            onChange={handleLabelChange}
            labelsDetails={issue.label_details}
            hideDropdownArrow
            maxRender={1}
            user={user}
            disabled={isNotAllowed}
          />
        )}
      </span>
    </div>
  );
};
