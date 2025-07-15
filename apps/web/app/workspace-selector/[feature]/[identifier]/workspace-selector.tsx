import { useCallback, useMemo, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { projectTemplateService } from "@plane/services";
import { EUserPermissions, IWorkspace } from "@plane/types";
import { Button, Loader, setToast, TOAST_TYPE } from "@plane/ui";
import { orderWorkspacesList } from "@plane/utils";
// hooks
import { useWorkspace } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
import { ApplicationService, OAuthService } from "@/plane-web/services/marketplace";
// local imports
import { WorkspaceSelectorEmptyState } from "./empty-state";
import { WorkspaceList } from "./workspace-list";

// service
const applicationService = new ApplicationService();
const oauthService = new OAuthService();

export enum ESupportedFeatures {
  APPS = "apps",
  PROJECT_TEMPLATES = "project-templates",
  EXTERNAL_APPS = "external-apps",
}

const getFeatureName = (feature: ESupportedFeatures) => {
  switch (feature) {
    case ESupportedFeatures.APPS:
      return "Apps";
    case ESupportedFeatures.PROJECT_TEMPLATES:
      return "Project templates";
    case ESupportedFeatures.EXTERNAL_APPS:
      return "Marketplace Apps";
  }
};

type TWorkspaceSelectorProps = {
  feature: ESupportedFeatures;
  identifier: string;
};

export const WorkspaceSelector = observer((props: TWorkspaceSelectorProps) => {
  const { feature, identifier } = props;
  // router
  const router = useAppRouter();
  // state
  const [selectedWorkspaceSlug, setSelectedWorkspaceSlug] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { loader, workspaces, getWorkspaceBySlug } = useWorkspace();
  // derived values
  const currentUserAdminWorkspaces = Object.values(workspaces ?? {})?.filter((w) => w.role === EUserPermissions.ADMIN);
  const isSubmissionButtonDisabled = isSubmitting || loader || !selectedWorkspaceSlug;
  const shouldShowEmptyState = !loader && currentUserAdminWorkspaces?.length === 0;
  const orderedWorkspacesList = useMemo(
    () => orderWorkspacesList(currentUserAdminWorkspaces),
    [currentUserAdminWorkspaces]
  );

  const handleExternalAppSubmission = async (appSlug: string) => {
    if (!selectedWorkspaceSlug) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Can't submit",
        message: "Please select a workspace",
      });
      return;
    }
    const app = await applicationService.getPublishedApplicationBySlug(selectedWorkspaceSlug, appSlug);

    // if the app is installed, redirect to the app configuration page
    if (app?.is_installed) {
      // redirect to applications page
      router.push(`/${selectedWorkspaceSlug}/settings/applications`);
      return;
    }

    // if the app is not installed, redirect to the app consent page
    const redirectUri = app?.redirect_uris.split(" ")[0];
    if (!app?.client_id || !redirectUri) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Can't submit",
        message: "Application details not found",
      });
      return;
    }
    const authorizationUrl = oauthService.getAuthorizationUrl({
      client_id: app.client_id,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "read write",
      workspace_slug: selectedWorkspaceSlug,
    });
    // redirect to app consent page
    window.location.assign(authorizationUrl);
  };

  // Handle submission for features that require manual submission
  const handleSubmission = useCallback(async () => {
    if (!selectedWorkspaceSlug) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Can't submit",
        message: "Please select a workspace",
      });
      return;
    }
    try {
      setIsSubmitting(true);
      switch (feature) {
        case ESupportedFeatures.APPS:
          router.push(`/${selectedWorkspaceSlug}/settings/integrations/${identifier}`);
          break;
        case ESupportedFeatures.PROJECT_TEMPLATES:
          await projectTemplateService.copy(selectedWorkspaceSlug, identifier);
          router.push(`/${selectedWorkspaceSlug}/settings/templates`);
          break;
        case ESupportedFeatures.EXTERNAL_APPS:
          await handleExternalAppSubmission(identifier);
          break;
        default:
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Can't submit",
            message: "Logic not implemented for this feature",
          });
          break;
      }
      setIsSubmitting(false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      switch (feature) {
        case ESupportedFeatures.PROJECT_TEMPLATES:
          // Handle payment related errors separately for project templates
          if (error?.error_code === 1999) {
            router.push(`/${selectedWorkspaceSlug}/settings/templates`);
            break;
          }
        default:
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Error while submitting",
            message: error?.error,
          });
      }
      setIsSubmitting(false);
    }
  }, [feature, identifier, router, selectedWorkspaceSlug]);

  // Handle workspace selection
  const handleWorkspaceSelection = useCallback(
    (workspace: IWorkspace) => {
      // If the workspace is already selected, deselect it
      if (selectedWorkspaceSlug === workspace.slug) {
        setSelectedWorkspaceSlug(null);
        return;
      }
      // Set the selected workspace id
      setSelectedWorkspaceSlug(workspace.slug);
    },
    [selectedWorkspaceSlug]
  );

  if (shouldShowEmptyState) {
    return <WorkspaceSelectorEmptyState />;
  }

  return (
    <div className="relative flex flex-col gap-4 h-full w-full justify-center px-8 pb-14 items-center">
      <div className="flex flex-col gap-2.5 items-center">
        <div className="text-3xl font-bold text-center">Choose a workspace to continue</div>
        <div className="font-medium text-custom-text-300 max-w-[450px] text-center">
          {getFeatureName(feature)} that work with Plane must connect to a workspace where you are an admin.
        </div>
      </div>
      <div className="overflow-y-auto vertical-scrollbar scrollbar-sm mt-2 mb-4 w-full md:w-fit">
        <div className="w-full flex flex-col md:w-[450px] bg-custom-background-90 rounded p-4 gap-2 border-[0.5px] border-custom-border-200">
          {loader ? (
            <Loader className="w-full flex flex-col gap-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <Loader.Item key={index} height="43px" />
              ))}
            </Loader>
          ) : (
            orderedWorkspacesList?.map((workspace) => (
              <WorkspaceList
                key={workspace.id}
                workspace={workspace}
                selectedWorkspaceSlug={selectedWorkspaceSlug}
                handleWorkspaceSelection={handleWorkspaceSelection}
              />
            ))
          )}
        </div>
      </div>
      <Button onClick={handleSubmission} className="w-full md:w-[450px]" disabled={isSubmissionButtonDisabled}>
        {isSubmitting ? t("common.confirming") : t("common.continue")}
      </Button>
    </div>
  );
});
