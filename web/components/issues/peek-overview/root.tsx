import { FC, Fragment, useEffect, useState, useMemo } from "react";
import { observer } from "mobx-react-lite";
// hooks
import useToast from "hooks/use-toast";
import { useIssueDetail, useIssues, useUser } from "hooks/store";
// components
import { IssueView } from "components/issues";
// types
import { TIssue } from "@plane/types";
// constants
import { EUserProjectRoles } from "constants/project";
import { EIssuesStoreType } from "constants/issue";

interface IIssuePeekOverview {
  is_archived?: boolean;
  onIssueUpdate?: (issue: Partial<TIssue>) => Promise<void>;
}

export type TIssuePeekOperations = {
  fetch: (workspaceSlug: string, projectId: string, issueId: string) => Promise<void>;
  update: (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    data: Partial<TIssue>,
    showToast?: boolean
  ) => Promise<void>;
  remove: (workspaceSlug: string, projectId: string, issueId: string) => Promise<void>;
  addIssueToCycle: (workspaceSlug: string, projectId: string, cycleId: string, issueIds: string[]) => Promise<void>;
  removeIssueFromCycle: (workspaceSlug: string, projectId: string, cycleId: string, issueId: string) => Promise<void>;
  addModulesToIssue?: (workspaceSlug: string, projectId: string, issueId: string, moduleIds: string[]) => Promise<void>;
  removeIssueFromModule?: (
    workspaceSlug: string,
    projectId: string,
    moduleId: string,
    issueId: string
  ) => Promise<void>;
  removeModulesFromIssue?: (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    moduleIds: string[]
  ) => Promise<void>;
};

export const IssuePeekOverview: FC<IIssuePeekOverview> = observer((props) => {
  const { is_archived = false, onIssueUpdate } = props;
  // hooks
  const { setToastAlert } = useToast();
  const {
    membership: { currentWorkspaceAllProjectsRole },
  } = useUser();
  const {
    issues: { removeIssue: removeArchivedIssue },
  } = useIssues(EIssuesStoreType.ARCHIVED);
  const {
    peekIssue,
    updateIssue,
    removeIssue,
    issue: { getIssueById, fetchIssue },
  } = useIssueDetail();
  const { addIssueToCycle, removeIssueFromCycle, addModulesToIssue, removeIssueFromModule, removeModulesFromIssue } =
    useIssueDetail();
  // state
  const [loader, setLoader] = useState(false);

  useEffect(() => {
    if (peekIssue) {
      setLoader(true);
      fetchIssue(peekIssue.workspaceSlug, peekIssue.projectId, peekIssue.issueId).finally(() => {
        setLoader(false);
      });
    }
  }, [peekIssue, fetchIssue]);

  const issueOperations: TIssuePeekOperations = useMemo(
    () => ({
      fetch: async (workspaceSlug: string, projectId: string, issueId: string) => {
        try {
          await fetchIssue(workspaceSlug, projectId, issueId);
        } catch (error) {
          console.error("Error fetching the parent issue");
        }
      },
      update: async (
        workspaceSlug: string,
        projectId: string,
        issueId: string,
        data: Partial<TIssue>,
        showToast: boolean = true
      ) => {
        try {
          const response = await updateIssue(workspaceSlug, projectId, issueId, data);
          if (onIssueUpdate) await onIssueUpdate(response);
          if (showToast)
            setToastAlert({
              title: "Issue updated successfully",
              type: "success",
              message: "Issue updated successfully",
            });
        } catch (error) {
          setToastAlert({
            title: "Issue update failed",
            type: "error",
            message: "Issue update failed",
          });
        }
      },
      remove: async (workspaceSlug: string, projectId: string, issueId: string) => {
        try {
          if (is_archived) await removeArchivedIssue(workspaceSlug, projectId, issueId);
          else await removeIssue(workspaceSlug, projectId, issueId);
          setToastAlert({
            title: "Issue deleted successfully",
            type: "success",
            message: "Issue deleted successfully",
          });
        } catch (error) {
          setToastAlert({
            title: "Issue delete failed",
            type: "error",
            message: "Issue delete failed",
          });
        }
      },
      addIssueToCycle: async (workspaceSlug: string, projectId: string, cycleId: string, issueIds: string[]) => {
        try {
          await addIssueToCycle(workspaceSlug, projectId, cycleId, issueIds);
          setToastAlert({
            title: "Cycle added to issue successfully",
            type: "success",
            message: "Issue added to issue successfully",
          });
        } catch (error) {
          setToastAlert({
            title: "Cycle add to issue failed",
            type: "error",
            message: "Cycle add to issue failed",
          });
        }
      },
      removeIssueFromCycle: async (workspaceSlug: string, projectId: string, cycleId: string, issueId: string) => {
        try {
          await removeIssueFromCycle(workspaceSlug, projectId, cycleId, issueId);
          setToastAlert({
            title: "Cycle removed from issue successfully",
            type: "success",
            message: "Cycle removed from issue successfully",
          });
        } catch (error) {
          setToastAlert({
            title: "Cycle remove from issue failed",
            type: "error",
            message: "Cycle remove from issue failed",
          });
        }
      },
      addModulesToIssue: async (workspaceSlug: string, projectId: string, issueId: string, moduleIds: string[]) => {
        try {
          await addModulesToIssue(workspaceSlug, projectId, issueId, moduleIds);
          setToastAlert({
            title: "Module added to issue successfully",
            type: "success",
            message: "Module added to issue successfully",
          });
        } catch (error) {
          setToastAlert({
            title: "Module add to issue failed",
            type: "error",
            message: "Module add to issue failed",
          });
        }
      },
      removeIssueFromModule: async (workspaceSlug: string, projectId: string, moduleId: string, issueId: string) => {
        try {
          await removeIssueFromModule(workspaceSlug, projectId, moduleId, issueId);
          setToastAlert({
            title: "Module removed from issue successfully",
            type: "success",
            message: "Module removed from issue successfully",
          });
        } catch (error) {
          setToastAlert({
            title: "Module remove from issue failed",
            type: "error",
            message: "Module remove from issue failed",
          });
        }
      },
      removeModulesFromIssue: async (
        workspaceSlug: string,
        projectId: string,
        issueId: string,
        moduleIds: string[]
      ) => {
        try {
          await removeModulesFromIssue(workspaceSlug, projectId, issueId, moduleIds);
          setToastAlert({
            title: "Module removed from issue successfully",
            type: "success",
            message: "Module removed from issue successfully",
          });
        } catch (error) {
          setToastAlert({
            title: "Module remove from issue failed",
            type: "error",
            message: "Module remove from issue failed",
          });
        }
      },
    }),
    [
      is_archived,
      fetchIssue,
      updateIssue,
      removeIssue,
      removeArchivedIssue,
      addIssueToCycle,
      removeIssueFromCycle,
      addModulesToIssue,
      removeIssueFromModule,
      removeModulesFromIssue,
      setToastAlert,
      onIssueUpdate,
    ]
  );

  if (!peekIssue?.workspaceSlug || !peekIssue?.projectId || !peekIssue?.issueId) return <></>;

  const issue = getIssueById(peekIssue.issueId) || undefined;

  const currentProjectRole = currentWorkspaceAllProjectsRole?.[peekIssue?.projectId];
  // Check if issue is editable, based on user role
  const is_editable = !!currentProjectRole && currentProjectRole >= EUserProjectRoles.MEMBER;
  const isLoading = !issue || loader ? true : false;

  return (
    <Fragment>
      <IssueView
        workspaceSlug={peekIssue.workspaceSlug}
        projectId={peekIssue.projectId}
        issueId={peekIssue.issueId}
        isLoading={isLoading}
        is_archived={is_archived}
        disabled={is_archived || !is_editable}
        issueOperations={issueOperations}
      />
    </Fragment>
  );
});
