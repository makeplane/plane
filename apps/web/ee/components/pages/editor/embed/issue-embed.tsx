import { useCallback, useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react";
import { AlertTriangle } from "lucide-react";
// constants
import { ISSUE_DISPLAY_PROPERTIES } from "@plane/constants";
// types
import { EIssueServiceType, EUserProjectRoles, IIssueDisplayProperties } from "@plane/types";
// ui
import { Loader } from "@plane/ui";
// components
import { IssueProperties } from "@/components/issues/issue-layouts/properties/all-properties";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useUserPermissions } from "@/hooks/store/user";
// plane web components
import { IssueIdentifier } from "@/plane-web/components/issues/issue-details/issue-identifier";

type Props = {
  issueId: string;
  projectId: string;
  workspaceSlug: string;
};

export const IssueEmbedCard: React.FC<Props> = observer((props) => {
  const { issueId, projectId, workspaceSlug } = props;
  // states
  const [error, setError] = useState<any | null>(null);
  // store hooks
  const { getProjectRoleByWorkspaceSlugAndProjectId } = useUserPermissions();
  const {
    setPeekIssue,
    issue: { fetchIssue, getIssueById, updateIssue },
  } = useIssueDetail();
  const {
    setPeekIssue: setPeekEpic,
    issue: { fetchIssue: fetchEpic, getIssueById: getEpicById, updateIssue: updateEpic },
  } = useIssueDetail(EIssueServiceType.EPICS);
  // derived values
  const projectRole = getProjectRoleByWorkspaceSlugAndProjectId(workspaceSlug, projectId);
  const issueDetails = getIssueById(issueId) ?? getEpicById(issueId);
  const isEpic = !!issueDetails?.is_epic;
  // callbacks
  const updateHandler = isEpic ? updateEpic : updateIssue;
  const setPeekHandler = isEpic ? setPeekEpic : setPeekIssue;
  // auth
  const isReadOnly = !!projectRole && projectRole < EUserProjectRoles.MEMBER;
  // issue display properties
  const displayProperties: IIssueDisplayProperties = useMemo(() => {
    const properties: IIssueDisplayProperties = {};
    ISSUE_DISPLAY_PROPERTIES.forEach((property) => {
      properties[property.key] = true;
    });
    return properties;
  }, []);

  // handle click
  const handleClick = useCallback(() => {
    setPeekHandler({
      issueId,
      projectId,
      workspaceSlug,
    });
  }, [issueId, projectId, setPeekHandler, workspaceSlug]);

  // fetch issue details if not available
  useEffect(() => {
    if (!issueDetails) {
      fetchIssue(workspaceSlug, projectId, issueId)
        .then(() => setError(null))
        .catch((error) => {
          setError(error);
          fetchEpic(workspaceSlug, projectId, issueId)
            .then(() => setError(null))
            .catch((error) => {
              setError(error);
            });
        });
    }
  }, [fetchEpic, fetchIssue, issueDetails, issueId, projectId, workspaceSlug]);

  if (!issueDetails && !error)
    return (
      <div className="rounded-md my-2">
        <Loader className="px-6">
          <Loader.Item height="30px" />
          <div className="mt-3 space-y-2">
            <Loader.Item height="20px" width="70%" />
            <Loader.Item height="20px" width="60%" />
          </div>
        </Loader>
      </div>
    );

  if (error)
    return (
      <div className="flex items-center gap-3 rounded-md border-2 border-orange-500 bg-orange-500/10 text-orange-500 px-4 py-3 my-2 text-base">
        <AlertTriangle className="text-orange-500 size-8" />
        This work item embed is not found in any project. It can no longer be updated or accessed from here.
      </div>
    );

  return (
    <div
      className="issue-embed cursor-pointer space-y-2 rounded-md bg-custom-background-90 p-3 my-2"
      role="button"
      onClick={handleClick}
    >
      <IssueIdentifier
        issueId={issueId}
        projectId={projectId}
        textContainerClassName="text-xs font-medium text-custom-text-300"
      />
      <h4 className="!text-sm !font-medium !mt-2 line-clamp-2 break-words">{issueDetails?.name}</h4>
      {issueDetails && (
        <IssueProperties
          className="flex flex-wrap items-center gap-2 whitespace-nowrap text-custom-text-300 pt-1.5"
          issue={issueDetails}
          displayProperties={displayProperties}
          activeLayout="Page work item embed"
          updateIssue={async (projectId, issueId, data) => {
            if (!projectId) return;
            updateHandler(workspaceSlug, projectId, issueId, data);
          }}
          isReadOnly={isReadOnly}
        />
      )}
    </div>
  );
});
