import { FC } from "react";
// ui
import { Tooltip } from "@plane/ui";
// types
import { IIssueLabels } from "types";

type IssueLabelsListProps = {
  labels?: (IIssueLabels | undefined)[];
  length?: number;
  showLength?: boolean;
};

export const IssueLabelsList: FC<IssueLabelsListProps> = (props) => {
  const { labels } = props;
  return (
    <>
      {labels && (
        <>
          <Tooltip position="top" tooltipHeading="Labels" tooltipContent={labels.map((l) => l?.name).join(", ")}>
            <div className="flex items-center gap-1.5 px-2 py-1 text-custom-text-200 rounded shadow-sm border border-custom-border-300">
              <span className="h-2 w-2 flex-shrink-0 rounded-full bg-custom-primary" />
              {`${labels.length} Labels`}
            </div>
          </Tooltip>
        </>
      )}
    </>
  );
};
