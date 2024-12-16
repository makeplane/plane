import { FC } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// store hooks
import { IWorkspaceAuthWrapper } from "@/ce/layouts/workspace-wrapper";
import { useWorkspace } from "@/hooks/store";
// layouts
import { WorkspaceAuthWrapper as CoreWorkspaceAuthWrapper } from "@/layouts/auth-layout";
// plane web hooks
import {
  useFlag,
  useIssueTypes,
  useTeams,
  useWorkspaceFeatures,
  useWorkspaceProjectStates,
  useWorkspaceSubscription,
  useFeatureFlags,
} from "@/plane-web/hooks/store";
// plane web types
import { EWorkspaceFeatures } from "@/plane-web/types/workspace-feature";

export const WorkspaceAuthWrapper: FC<IWorkspaceAuthWrapper> = observer((props) => {
  // props
  const { children } = props;
  // router
  const { workspaceSlug } = useParams();
  // hooks
  const { currentWorkspace } = useWorkspace();
  // store hooks
  const { fetchFeatureFlags } = useFeatureFlags();
  const { fetchWorkspaceFeatures, workspaceFeatures } = useWorkspaceFeatures();
  const { fetchProjectStates } = useWorkspaceProjectStates();
  const { isTeamsFeatureEnabled, fetchTeams } = useTeams();
  const { fetchWorkspaceSubscribedPlan } = useWorkspaceSubscription();
  const { fetchAll } = useIssueTypes();
  // derived values
  const isIssueTypesEnabled = useFlag(workspaceSlug?.toString(), "ISSUE_TYPE_DISPLAY", false);
  const isEpicsEnabled = useFlag(workspaceSlug?.toString(), "EPICS_DISPLAY", false);
  const isProjectStateEnabled =
    workspaceFeatures[workspaceSlug.toString()] &&
    workspaceFeatures[workspaceSlug.toString()][EWorkspaceFeatures.IS_PROJECT_GROUPING_ENABLED];

  // fetching feature flags
  const { isLoading: flagsLoader, error: flagsError } = useSWR(
    workspaceSlug ? `WORKSPACE_FLAGS_${workspaceSlug}` : null,
    workspaceSlug ? () => fetchFeatureFlags(workspaceSlug.toString()) : null,
    { revalidateOnFocus: false, errorRetryCount: 1 }
  );
  // fetch workspace current plane information
  useSWR(
    workspaceSlug ? `WORKSPACE_CURRENT_PLAN_${workspaceSlug}` : null,
    workspaceSlug ? () => fetchWorkspaceSubscribedPlan(workspaceSlug.toString()) : null,
    {
      errorRetryCount: 2,
      revalidateOnFocus: false,
      revalidateIfStale: false,
    }
  );
  // fetching workspace features
  useSWR(
    workspaceSlug && currentWorkspace ? `WORKSPACE_FEATURES_${workspaceSlug}` : null,
    workspaceSlug && currentWorkspace ? () => fetchWorkspaceFeatures(workspaceSlug.toString()) : null,
    { revalidateOnFocus: false }
  );

  // fetch project states
  useSWR(
    workspaceSlug && currentWorkspace && isProjectStateEnabled ? `WORKSPACE_PROJECT_STATES_${workspaceSlug}` : null,
    () =>
      workspaceSlug && currentWorkspace && isProjectStateEnabled ? fetchProjectStates(workspaceSlug.toString()) : null,
    { revalidateOnFocus: false }
  );
  // fetching all issue types and epics for the workspace
  useSWR(
    workspaceSlug && (isIssueTypesEnabled || isEpicsEnabled)
      ? `WORKSPACE_ISSUE_TYPES_${workspaceSlug}_${isIssueTypesEnabled}_${isEpicsEnabled}`
      : null,
    workspaceSlug && (isIssueTypesEnabled || isEpicsEnabled) ? () => fetchAll(workspaceSlug.toString()) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );
  // fetching teams
  useSWR(
    workspaceSlug && isTeamsFeatureEnabled ? `WORKSPACE_TEAMS_${workspaceSlug}` : null,
    workspaceSlug && isTeamsFeatureEnabled ? () => fetchTeams(workspaceSlug.toString()) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  // loading state
  const isLoading = flagsLoader && !flagsError;

  return <CoreWorkspaceAuthWrapper isLoading={isLoading}>{children}</CoreWorkspaceAuthWrapper>;
});
