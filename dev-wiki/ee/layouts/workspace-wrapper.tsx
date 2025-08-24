import { FC } from "react";
import { observer } from "mobx-react";
import { useParams, usePathname } from "next/navigation";
import useSWR from "swr";
// store hooks
import { IWorkspaceAuthWrapper } from "@/ce/layouts/workspace-wrapper";
import { useWorkspace } from "@/hooks/store";
// layouts
import { WorkspaceAuthWrapper as CoreWorkspaceAuthWrapper } from "@/layouts/auth-layout";
// plane web components
// plane web hooks
import { WorkspaceDisabledPage } from "../components/workspace-disabled";
import { useFeatureFlags, useWorkspaceFeatures } from "../hooks/store";
import { useWorkspaceSubscription } from "../hooks/use-workspace-subscription";
// plane web types
export const WorkspaceAuthWrapper: FC<IWorkspaceAuthWrapper> = observer((props) => {
  // props
  const { children } = props;
  // router
  const { workspaceSlug } = useParams();
  const pathname = usePathname();
  // hooks
  const { currentWorkspace } = useWorkspace();
  // store hooks
  const { fetchFeatureFlags } = useFeatureFlags();
  const { fetchWorkspaceFeatures, workspaceFeatures } = useWorkspaceFeatures();
  const { currentWorkspaceSubscribedPlanDetail: subscriptionDetail, fetchWorkspaceSubscribedPlan } =
    useWorkspaceSubscription();
  // derived values
  const isFreeMemberCountExceeded = subscriptionDetail?.is_free_member_count_exceeded;
  const isWorkspaceSettingsRoute = pathname.includes(`/${workspaceSlug}/settings`);

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

  // loading state
  const isLoading = flagsLoader && !flagsError;

  // if workspace has exceeded the free member count
  if (isFreeMemberCountExceeded && !isWorkspaceSettingsRoute) {
    return (
      <CoreWorkspaceAuthWrapper isLoading={isLoading}>
        <WorkspaceDisabledPage />
      </CoreWorkspaceAuthWrapper>
    );
  }

  return <CoreWorkspaceAuthWrapper isLoading={isLoading}>{children}</CoreWorkspaceAuthWrapper>;
});
