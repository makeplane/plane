import React from "react";

type IssueLabelsListProps = {
  labels?: (string | undefined)[];
  length?: number;
  showLength?: boolean;
};

export const IssueLabelsList: React.FC<IssueLabelsListProps> = ({
  labels,
  length = 5,
  showLength = true,
}) => (
  <>
    {labels && (
      <>
        {labels.slice(0, length).map((color, index) => (
          <div className={`flex h-4 w-4 rounded-full ${index ? "-ml-3.5" : ""}`}>
            <span
              className={`h-4 w-4 flex-shrink-0 rounded-full border border-brand-base
              `}
              style={{
                backgroundColor: color && color !== "" ? color : "#000000",
              }}
            />
          </div>
        ))}
        {labels.length > length ? <span>+{labels.length - length}</span> : null}
      </>
    )}
  </>
);
