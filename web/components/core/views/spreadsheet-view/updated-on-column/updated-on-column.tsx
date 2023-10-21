import { FC } from "react";
// types
import { IUser, IIssue, Properties } from "types";
// helper
import { renderLongDetailDateFormat } from "helpers/date-time.helper";

type Props = {
  issue: IIssue;
  projectId: string;
  partialUpdateIssue: (formData: Partial<IIssue>, issue: IIssue) => void;
  properties: Properties;
  user: IUser | undefined;
  isNotAllowed: boolean;
};

export const UpdatedOnColumn: FC<Props> = (props) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { issue, projectId, partialUpdateIssue, properties, user, isNotAllowed } = props;
  return (
    <div className="flex items-center text-sm h-11 w-full bg-custom-background-100">
      <span className="flex items-center px-4 py-2.5 h-full w-full flex-shrink-0 border-r border-b border-custom-border-100">
        {properties.updated_on && (
          <div className="flex items-center text-xs cursor-default text-custom-text-200 text-center p-2 group-hover:bg-custom-background-80 border-custom-border-200">
            {renderLongDetailDateFormat(issue.updated_at)}
          </div>
        )}
      </span>
    </div>
  );
};
