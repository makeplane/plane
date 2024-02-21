import { FC, Fragment, useEffect, useState, useMemo } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// hooks
import useToast from "hooks/use-toast";
import { useEventTracker, useIssueDetail, useIssues, useUser } from "hooks/store";
// components
import { IssueView } from "components/issues";
// types
import { TIssue } from "@plane/types";
// constants
import { EUserProjectRoles } from "constants/project";
import { EIssuesStoreType } from "constants/issue";
import { ISSUE_UPDATED, ISSUE_DELETED } from "constants/event-tracker";

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
  // router
  const router = useRouter();
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
  const { captureIssueEvent } = useEventTracker();
  // state
  const [loader, setLoader] = useState(false);

  const issueOperations: TIssuePeekOperations = useMemo(
    () => ({
      fetch: async (workspaceSlug: string, projectId: string, issueId: string) => {
        try {
          await fetchIssue(workspaceSlug, projectId, issueId, is_archived);
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
          captureIssueEvent({
            eventName: ISSUE_UPDATED,
            payload: { ...response, state: "SUCCESS", element: "Issue peek-overview" },
            updates: {
              changed_property: Object.keys(data).join(","),
              change_details: Object.values(data).join(","),
            },
            path: router.asPath,
          });
        } catch (error) {
          captureIssueEvent({
            eventName: ISSUE_UPDATED,
            payload: { state: "FAILED", element: "Issue peek-overview" },
            path: router.asPath,
          });
          setToastAlert({
            title: "Issue update failed",
            type: "error",
            message: "Issue update failed",
          });
        }
      },
      remove: async (workspaceSlug: string, projectId: string, issueId: string) => {
        try {
          let response;
          if (is_archived) response = await removeArchivedIssue(workspaceSlug, projectId, issueId);
          else response = await removeIssue(workspaceSlug, projectId, issueId);
          setToastAlert({
            title: "Issue deleted successfully",
            type: "success",
            message: "Issue deleted successfully",
          });
          captureIssueEvent({
            eventName: ISSUE_DELETED,
            payload: { id: issueId, state: "SUCCESS", element: "Issue peek-overview" },
            path: router.asPath,
          });
        } catch (error) {
          setToastAlert({
            title: "Issue delete failed",
            type: "error",
            message: "Issue delete failed",
          });
          captureIssueEvent({
            eventName: ISSUE_DELETED,
            payload: { id: issueId, state: "FAILED", element: "Issue peek-overview" },
            path: router.asPath,
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
          captureIssueEvent({
            eventName: ISSUE_UPDATED,
            payload: { ...issueIds, state: "SUCCESS", element: "Issue peek-overview" },
            updates: {
              changed_property: "cycle_id",
              change_details: cycleId,
            },
            path: router.asPath,
          });
        } catch (error) {
          captureIssueEvent({
            eventName: ISSUE_UPDATED,
            payload: { state: "FAILED", element: "Issue peek-overview" },
            updates: {
              changed_property: "cycle_id",
              change_details: cycleId,
            },
            path: router.asPath,
          });
          setToastAlert({
            title: "Cycle add to issue failed",
            type: "error",
            message: "Cycle add to issue failed",
          });
        }
      },
      removeIssueFromCycle: async (workspaceSlug: string, projectId: string, cycleId: string, issueId: string) => {
        try {
          const response = await removeIssueFromCycle(workspaceSlug, projectId, cycleId, issueId);
          setToastAlert({
            title: "Cycle removed from issue successfully",
            type: "success",
            message: "Cycle removed from issue successfully",
          });
          captureIssueEvent({
            eventName: ISSUE_UPDATED,
            payload: { ...response, state: "SUCCESS", element: "Issue peek-overview" },
            updates: {
              changed_property: "cycle_id",
              change_details: "",
            },
            path: router.asPath,
          });
        } catch (error) {
          setToastAlert({
            title: "Cycle remove from issue failed",
            type: "error",
            message: "Cycle remove from issue failed",
          });
          captureIssueEvent({
            eventName: ISSUE_UPDATED,
            payload: { state: "FAILED", element: "Issue peek-overview" },
            updates: {
              changed_property: "cycle_id",
              change_details: "",
            },
            path: router.asPath,
          });
        }
      },
      addModulesToIssue: async (workspaceSlug: string, projectId: string, issueId: string, moduleIds: string[]) => {
        try {
          const response = await addModulesToIssue(workspaceSlug, projectId, issueId, moduleIds);
          setToastAlert({
            title: "Module added to issue successfully",
            type: "success",
            message: "Module added to issue successfully",
          });
          captureIssueEvent({
            eventName: ISSUE_UPDATED,
            payload: { ...response, state: "SUCCESS", element: "Issue peek-overview" },
            updates: {
              changed_property: "module_id",
              change_details: moduleIds,
            },
            path: router.asPath,
          });
        } catch (error) {
          captureIssueEvent({
            eventName: ISSUE_UPDATED,
            payload: { id: issueId, state: "FAILED", element: "Issue peek-overview" },
            updates: {
              changed_property: "module_id",
              change_details: moduleIds,
            },
            path: router.asPath,
          });
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
          captureIssueEvent({
            eventName: ISSUE_UPDATED,
            payload: { id: issueId, state: "SUCCESS", element: "Issue peek-overview" },
            updates: {
              changed_property: "module_id",
              change_details: "",
            },
            path: router.asPath,
          });
        } catch (error) {
          captureIssueEvent({
            eventName: ISSUE_UPDATED,
            payload: { id: issueId, state: "FAILED", element: "Issue peek-overview" },
            updates: {
              changed_property: "module_id",
              change_details: "",
            },
            path: router.asPath,
          });
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
      captureIssueEvent,
      router.asPath,
    ]
  );

  useEffect(() => {
    if (peekIssue) {
      setLoader(true);
      issueOperations.fetch(peekIssue.workspaceSlug, peekIssue.projectId, peekIssue.issueId).finally(() => {
        setLoader(false);
      });
    }
  }, [peekIssue, issueOperations]);

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
