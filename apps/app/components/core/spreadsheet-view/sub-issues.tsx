import React, { useState } from "react";

// hooks
import useSubIssue from "hooks/use-sub-issue";
// components
import { SingleSpreadsheetIssue } from "components/core";
// types
import { ICurrentUserResponse, IIssue, Properties, UserAuth } from "types";

type Props = {
  issue: IIssue;
  properties: Properties;
  gridTemplateColumns: string;
  user: ICurrentUserResponse | undefined;
  userAuth: UserAuth;
};

export const SubIssues: React.FC<Props> = ({
  issue,
  properties,
  gridTemplateColumns,
  user,
  userAuth,
}) => {
  const [expanded, setExpanded] = useState(false);
  const { subIssues } = useSubIssue(issue.id);

  return (
    <>
      {subIssues &&
        subIssues.map((subIssue, subIndex) => (
          <>
            <div className="border-b border-brand-base w-full min-w-max" key={subIndex}>
              <SingleSpreadsheetIssue
                issue={subIssue}
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
                issue={subIssue}
                gridTemplateColumns={gridTemplateColumns}
                properties={properties}
                user={user}
                userAuth={userAuth}
              />
            )}
          </>
        ))}
    </>
  );
};
