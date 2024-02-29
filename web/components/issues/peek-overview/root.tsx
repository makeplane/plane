import { FC, Fragment, useEffect, useState, useMemo } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// hooks
import { useEventTracker, useIssueDetail, useIssues, useUser } from "hooks/store";
// ui
import { TOAST_TYPE, setPromiseToast, setToast } from "@plane/ui";
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
  const { is_archived = false } = props;
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
        const updateIssuePromise = updateIssue(workspaceSlug, projectId, issueId, data);
        if (showToast) {
          setPromiseToast(updateIssuePromise, {
            loading: "Updating issue...",
            success: {
              title: "Issue updated successfully",
              message: () => "Issue updated successfully",
            },
            error: {
              title: "Issue update failed",
              message: () => "Issue update failed",
            },
          });
        }

        await updateIssuePromise
          .then(() => {
            captureIssueEvent({
              eventName: ISSUE_UPDATED,
              payload: { ...data, issueId, state: "SUCCESS", element: "Issue peek-overview" },
              updates: {
                changed_property: Object.keys(data).join(","),
                change_details: Object.values(data).join(","),
              },
              path: router.asPath,
            });
          })
          .catch(() => {
            captureIssueEvent({
              eventName: ISSUE_UPDATED,
              payload: { state: "FAILED", element: "Issue peek-overview" },
              path: router.asPath,
            });
          });
      },
      remove: async (workspaceSlug: string, projectId: string, issueId: string) => {
        try {
          let response;
          if (is_archived) response = await removeArchivedIssue(workspaceSlug, projectId, issueId);
          else response = await removeIssue(workspaceSlug, projectId, issueId);
          setToast({
            title: "Issue deleted successfully",
            type: TOAST_TYPE.SUCCESS,
            message: "Issue deleted successfully",
          });
          captureIssueEvent({
            eventName: ISSUE_DELETED,
            payload: { id: issueId, state: "SUCCESS", element: "Issue peek-overview" },
            path: router.asPath,
          });
        } catch (error) {
          setToast({
            title: "Issue delete failed",
            type: TOAST_TYPE.ERROR,
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
          setToast({
            title: "Cycle added to issue successfully",
            type: TOAST_TYPE.SUCCESS,
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
          setToast({
            title: "Cycle add to issue failed",
            type: TOAST_TYPE.ERROR,
            message: "Cycle add to issue failed",
          });
        }
      },
      removeIssueFromCycle: async (workspaceSlug: string, projectId: string, cycleId: string, issueId: string) => {
        try {
          const response = await removeIssueFromCycle(workspaceSlug, projectId, cycleId, issueId);
          setToast({
            title: "Cycle removed from issue successfully",
            type: TOAST_TYPE.SUCCESS,
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
          setToast({
            title: "Cycle remove from issue failed",
            type: TOAST_TYPE.ERROR,
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
          setToast({
            title: "Module added to issue successfully",
            type: TOAST_TYPE.SUCCESS,
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
          setToast({
            title: "Module add to issue failed",
            type: TOAST_TYPE.ERROR,
            message: "Module add to issue failed",
          });
        }
      },
      removeIssueFromModule: async (workspaceSlug: string, projectId: string, moduleId: string, issueId: string) => {
        try {
          await removeIssueFromModule(workspaceSlug, projectId, moduleId, issueId);
          setToast({
            title: "Module removed from issue successfully",
            type: TOAST_TYPE.SUCCESS,
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
          setToast({
            title: "Module remove from issue failed",
            type: TOAST_TYPE.ERROR,
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
          setToast({
            title: "Module removed from issue successfully",
            type: TOAST_TYPE.SUCCESS,
            message: "Module removed from issue successfully",
          });
        } catch (error) {
          setToast({
            title: "Module remove from issue failed",
            type: TOAST_TYPE.ERROR,
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
