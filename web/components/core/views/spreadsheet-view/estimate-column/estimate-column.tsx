import { FC } from "react";
// components
import { ViewEstimateSelect } from "components/issues";
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

export const EstimateColumn: FC<Props> = (props) => {
  const { issue, partialUpdateIssue, properties, user, isNotAllowed } = props;

  return (
    <div className="flex items-center text-sm h-11 w-full bg-custom-background-100">
      <span className="flex items-center px-4 py-2.5 h-full w-full flex-shrink-0 border-r border-b border-custom-border-100">
        {properties.estimate && (
          <ViewEstimateSelect
            issue={issue}
            partialUpdateIssue={partialUpdateIssue}
            position="left"
            user={user}
            isNotAllowed={isNotAllowed}
          />
        )}
      </span>
    </div>
  );
};
