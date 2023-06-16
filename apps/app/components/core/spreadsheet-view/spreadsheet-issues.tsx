import React, { useState } from "react";

// components
import { SingleSpreadsheetIssue, SubIssues } from "components/core";
// types
import { ICurrentUserResponse, IIssue, Properties, UserAuth } from "types";

type Props = {
  issue: IIssue;
  index: number;
  properties: Properties;
  gridTemplateColumns: string;
  user: ICurrentUserResponse | undefined;
  userAuth: UserAuth;
};

export const SpreadsheetIssues: React.FC<Props> = ({
  issue,
  index,
  gridTemplateColumns,
  properties,
  user,
  userAuth,
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <div className="border-b border-brand-base w-full min-w-max">
        <SingleSpreadsheetIssue
          issue={issue}
          position={index + 1}
          gridTemplateColumns={gridTemplateColumns}
          properties={properties}
          expanded={expanded}
          setExpanded={setExpanded}
          user={user}
          userAuth={userAuth}
        />
      </div>

      {expanded && (
        <SubIssues
          issue={issue}
          gridTemplateColumns={gridTemplateColumns}
          properties={properties}
          user={user}
          userAuth={userAuth}
        />
      )}
    </>
  );
};
