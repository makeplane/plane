import { FC, useEffect } from "react";
import { observer } from "mobx-react";
import { useParams, usePathname } from "next/navigation";
import useSWR from "swr";
// plane imports
import { E_FEATURE_FLAGS, ETemplateLevel } from "@plane/constants";
// store hooks
import { IWorkspaceAuthWrapper } from "@/ce/layouts/workspace-wrapper";
import { useWorkspace } from "@/hooks/store/use-workspace";
// layouts
import { WorkspaceAuthWrapper as CoreWorkspaceAuthWrapper } from "@/layouts/auth-layout/workspace-wrapper";
// plane web components
import { WorkspaceDisabledPage } from "@/plane-web/components/license";
// plane web hooks
import {
  useFlag,
  useIssueTypes,
  useTeamspaces,
  useWorkspaceFeatures,
  useWorkspaceProjectStates,
  useWorkspaceSubscription,
  useFeatureFlags,
  useWorkItemTemplates,
  useCustomerProperties,
  useCustomers,
  usePageTemplates,
  useProjectTemplates,
  useTemplateHelper,
} from "@/plane-web/hooks/store";
// plane web types
import { useProjectAdvanced } from "@/plane-web/hooks/store/projects/use-projects";
import { usePiChat } from "@/plane-web/hooks/store/use-pi-chat";
import { EWorkspaceFeatures } from "@/plane-web/types/workspace-feature";
import { useInitiatives } from "../hooks/store/use-initiatives";
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
  const { fetchProjectFeatures } = useProjectAdvanced();
  const { fetchProjectStates } = useWorkspaceProjectStates();
  const { isTeamspacesFeatureEnabled, fetchTeamspaces } = useTeamspaces();
  const { currentWorkspaceSubscribedPlanDetail: subscriptionDetail, fetchWorkspaceSubscribedPlan } =
    useWorkspaceSubscription();
  const { fetchAll } = useIssueTypes();
  const { fetchAllTemplates: fetchAllProjectTemplates } = useProjectTemplates();
  const { fetchAllTemplates: fetchAllWorkItemTemplates } = useWorkItemTemplates();
  const { fetchAllTemplates: fetchAllPageTemplates } = usePageTemplates();
  const { getIsTemplatePublishEnabled, fetchTemplateCategories } = useTemplateHelper();
  const { fetchAllCustomerPropertiesAndOptions } = useCustomerProperties();
  const { isCustomersFeatureEnabled, fetchCustomers } = useCustomers();
  const { initiative } = useInitiatives();
  const { initPiChat } = usePiChat();
  // derived values
  const isFreeMemberCountExceeded = subscriptionDetail?.is_free_member_count_exceeded;
  const isWorkspaceSettingsRoute = pathname.includes(`/${workspaceSlug}/settings`);
  const isIssueTypesEnabled = useFlag(workspaceSlug?.toString(), "ISSUE_TYPES", false);
  const isEpicsEnabled = useFlag(workspaceSlug?.toString(), "EPICS", false);
  const isProjectStateEnabled =
    workspaceFeatures[workspaceSlug.toString()] &&
    workspaceFeatures[workspaceSlug.toString()][EWorkspaceFeatures.IS_PROJECT_GROUPING_ENABLED];
  const isProjectTemplatesEnabled = useFlag(workspaceSlug?.toString(), "PROJECT_TEMPLATES");
  const isWorkItemTemplatesEnabled = useFlag(workspaceSlug?.toString(), "WORKITEM_TEMPLATES");
  const isPageTemplatesEnabled = useFlag(workspaceSlug?.toString(), "PAGE_TEMPLATES");
  const isInitiativesFeatureEnabled = initiative.isInitiativesFeatureEnabled;
  const isTemplatePublishEnabled = getIsTemplatePublishEnabled(workspaceSlug.toString());
  const isPiEnabled =
    useFlag(workspaceSlug?.toString(), E_FEATURE_FLAGS.PI_CHAT) &&
    workspaceFeatures[workspaceSlug.toString()] &&
    workspaceFeatures[workspaceSlug.toString()][EWorkspaceFeatures.IS_PI_ENABLED];

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

  // fetching project features
  useSWR(
    workspaceSlug ? `PROJECT_FEATURES_${workspaceSlug}` : null,
    workspaceSlug
      ? () => {
          fetchProjectFeatures(workspaceSlug.toString());
        }
      : null,
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
  // fetching teamspaces
  useSWR(
    workspaceSlug && isTeamspacesFeatureEnabled
      ? `WORKSPACE_TEAMSPACES_${workspaceSlug}_${isTeamspacesFeatureEnabled}`
      : null,
    workspaceSlug && isTeamspacesFeatureEnabled ? () => fetchTeamspaces(workspaceSlug.toString()) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );
  // fetching customer properties
  useSWR(
    workspaceSlug && isCustomersFeatureEnabled
      ? `CUSTOMER_PROPERTIES_${workspaceSlug}_${isCustomersFeatureEnabled}`
      : null,
    workspaceSlug && isCustomersFeatureEnabled
      ? () => fetchAllCustomerPropertiesAndOptions(workspaceSlug.toString())
      : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  // fetch customers
  useSWR(
    workspaceSlug && isCustomersFeatureEnabled ? `CUSTOMERS_${workspaceSlug}_${isCustomersFeatureEnabled}` : null,
    workspaceSlug && isCustomersFeatureEnabled ? () => fetchCustomers(workspaceSlug.toString()) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  // fetching all project templates
  useSWR(
    workspaceSlug && isProjectTemplatesEnabled ? ["projectTemplates", workspaceSlug, isProjectTemplatesEnabled] : null,
    workspaceSlug && isProjectTemplatesEnabled
      ? () => fetchAllProjectTemplates({ workspaceSlug: workspaceSlug.toString() })
      : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  // fetching all work item templates
  useSWR(
    workspaceSlug && isWorkItemTemplatesEnabled
      ? ["workItemTemplates", workspaceSlug, isWorkItemTemplatesEnabled]
      : null,
    workspaceSlug && isWorkItemTemplatesEnabled
      ? () => fetchAllWorkItemTemplates({ workspaceSlug: workspaceSlug.toString(), level: ETemplateLevel.WORKSPACE })
      : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  // fetching all page templates
  useSWR(
    workspaceSlug && isPageTemplatesEnabled ? ["pageTemplates", workspaceSlug, isPageTemplatesEnabled] : null,
    workspaceSlug && isPageTemplatesEnabled
      ? () => fetchAllPageTemplates({ workspaceSlug: workspaceSlug.toString(), level: ETemplateLevel.WORKSPACE })
      : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  // fetching all initiatives
  useSWR(
    workspaceSlug && isInitiativesFeatureEnabled ? ["initiatives", workspaceSlug, isInitiativesFeatureEnabled] : null,
    workspaceSlug && isInitiativesFeatureEnabled ? () => initiative.fetchInitiatives(workspaceSlug.toString()) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  // fetching template categories
  useSWR(
    workspaceSlug && isTemplatePublishEnabled ? ["templateCategories", workspaceSlug, isTemplatePublishEnabled] : null,
    workspaceSlug && isTemplatePublishEnabled ? () => fetchTemplateCategories() : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  // loading state
  const isLoading = flagsLoader && !flagsError;

  useEffect(() => {
    if (isPiEnabled) {
      initPiChat();
    }
  }, [isPiEnabled]);

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
