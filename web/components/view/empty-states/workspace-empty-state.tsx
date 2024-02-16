import { FC, ReactNode } from "react";
import { observer } from "mobx-react-lite";
// hooks
import { useIssues, useProject } from "hooks/store";

// types
import { TViewTypes } from "@plane/types";

type TViewEmptyStateRoot = {
  workspaceSlug: string;
  projectId: string | undefined;
  viewId: string;
  viewType: TViewTypes;
  children: ReactNode;
};

export const ViewEmptyStateRoot: FC<TViewEmptyStateRoot> = observer((props) => {
  const { workspaceSlug, projectId, viewId, viewType, children } = props;
  // hooks
  const { workspaceProjectIds } = useProject();
  const { issueMap } = useIssues();

  const areIssueAvailable = projectId ? true : (Object.values(issueMap) ?? []).length === 0 ? true : false;

  if (!workspaceSlug) return <></>;
  return (
    <>
      {(workspaceProjectIds ?? []).length === 0 ? (
        <div className="relative w-full h-full">No Projects are available.</div>
      ) : (
        <>
          {areIssueAvailable ? <>{children}</> : <div className="relative w-full h-full">No issues are available.</div>}
        </>
      )}
    </>
  );
});
