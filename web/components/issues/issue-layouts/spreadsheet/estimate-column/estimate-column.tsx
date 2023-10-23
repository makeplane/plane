import { FC } from "react";
// components
import { ViewEstimateSelect } from "components/issues";
// types
import { IIssue } from "types";

type Props = {
  issue: IIssue;
  onChange: (data: number) => void;
  disabled: boolean;
};

export const EstimateColumn: FC<Props> = (props) => {
  const { issue, onChange, disabled } = props;

  return (
    <div className="flex items-center text-sm h-11 w-full bg-custom-background-100">
      <span className="flex items-center px-4 py-2.5 h-full w-full flex-shrink-0 border-r border-b border-custom-border-100">
        <ViewEstimateSelect issue={issue} onChange={onChange} disabled={disabled} />
      </span>
    </div>
  );
};
