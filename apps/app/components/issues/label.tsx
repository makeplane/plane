import React from "react";

// components
import { Tooltip } from "components/ui";
// types
import { IIssue } from "types";

type Props = {
  issue: IIssue;
  maxRender?: number;
};

export const ViewIssueLabel: React.FC<Props> = ({ issue, maxRender = 1 }) => (
  <>
    {issue.label_details.length > 0 ? (
      issue.label_details.length <= maxRender ? (
        <>
          {issue.label_details.map((label, index) => (
            <div
              key={label.id}
              className="flex cursor-default items-center rounded-md border border-custom-border-300 px-2.5 py-1 text-xs shadow-sm"
            >
              <Tooltip position="top" tooltipHeading="Label" tooltipContent={label.name}>
                <div className="flex items-center gap-1.5 text-custom-text-200">
                  <span
                    className="h-2 w-2 flex-shrink-0 rounded-full"
                    style={{
                      backgroundColor: label?.color ?? "#000000",
                    }}
                  />
                  {label.name}
                </div>
              </Tooltip>
            </div>
          ))}
        </>
      ) : (
        <div className="flex cursor-default items-center rounded-md border border-custom-border-300 px-2.5 py-1 text-xs shadow-sm">
          <Tooltip
            position="top"
            tooltipHeading="Labels"
            tooltipContent={issue.label_details.map((l) => l.name).join(", ")}
          >
            <div className="flex items-center gap-1.5 text-custom-text-200">
              <span className="h-2 w-2 flex-shrink-0 rounded-full bg-custom-primary" />
              {`${issue.label_details.length} Labels`}
            </div>
          </Tooltip>
        </div>
      )
    ) : (
      ""
    )}
  </>
);
