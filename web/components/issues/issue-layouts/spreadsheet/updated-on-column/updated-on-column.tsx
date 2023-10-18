// helpers
import { renderLongDetailDateFormat } from "helpers/date-time.helper";
// types
import { IIssue } from "types";

type Props = {
  issue: IIssue;
};

export const UpdatedOnColumn: React.FC<Props> = (props) => {
  const { issue } = props;

  return (
    <div className="flex items-center text-sm h-11 w-full bg-custom-background-100">
      <span className="flex items-center px-4 py-2.5 h-full w-full flex-shrink-0 border-r border-b border-custom-border-100">
        <div className="flex items-center text-xs cursor-default text-custom-text-200 text-center p-2 group-hover:bg-custom-background-80 border-custom-border-200">
          {renderLongDetailDateFormat(issue.updated_at)}
        </div>
      </span>
    </div>
  );
};
