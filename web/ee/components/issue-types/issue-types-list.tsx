import { observer } from "mobx-react";
// ui
import { useParams } from "next/navigation";
import { Loader } from "@plane/ui";
// plane web components
import { IssueTypeListItem } from "@/plane-web/components/issue-types";
// plane web hooks
import { useIssueTypes } from "@/plane-web/hooks/store";

export const IssueTypesList = observer(() => {
  // router
  const { projectId } = useParams();
  // store hooks
  const { getProjectIssueTypeLoader, getProjectIssueTypeIds, getProjectDefaultIssueType } = useIssueTypes();
  // derived states
  const issueTypeLoader = getProjectIssueTypeLoader(projectId?.toString());
  const currentProjectIssueTypeIds = getProjectIssueTypeIds(projectId?.toString());
  const currentProjectDefaultIssueType = getProjectDefaultIssueType(projectId?.toString());

  if (issueTypeLoader === "init-loader") {
    return (
      <Loader className="space-y-6 py-2">
        <Loader className="space-y-2">
          <Loader.Item height="60px" />
          <Loader.Item height="240px" />
        </Loader>
        <Loader.Item height="60px" />
        <Loader.Item height="60px" />
      </Loader>
    );
  }

  return (
    <div>
      {currentProjectIssueTypeIds &&
        currentProjectIssueTypeIds.map((issueTypeId) => (
          <IssueTypeListItem
            key={issueTypeId}
            issueTypeId={issueTypeId}
            isDefaultOpen={
              issueTypeId === currentProjectDefaultIssueType?.id && currentProjectIssueTypeIds.length === 1
            }
          />
        ))}
    </div>
  );
});
