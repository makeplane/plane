"use client";

import { observer } from "mobx-react";

// component
import { useParams } from "next/navigation";
import useSWR from "swr";
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { TApplication } from "@plane/types";
import { setToast, TOAST_TYPE } from "@plane/ui";
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { PageHead } from "@/components/core/page-title";
// hooks
import { EmailSettingsLoader } from "@/components/ui/loader/settings/email";
import { APPLICATION_CATEGORIES_LIST, APPLICATION_DETAILS } from "@/constants/fetch-keys";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUserPermissions } from "@/hooks/store/user";
// plane web components
import { CreateUpdateApplication } from "@/plane-web/components/marketplace";
import { useApplications } from "@/plane-web/hooks/store";

const ApplicationEditPage = observer(() => {
  // store hooks
  const { workspaceUserInfo, allowPermissions } = useUserPermissions();
  const { currentWorkspace } = useWorkspace();
  const { appSlug } = useParams();
  const { updateApplication, getApplicationBySlug, fetchApplication, fetchApplicationCategories } = useApplications();

  // derived values
  const canPerformWorkspaceAdminActions = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE);
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace.name} - Edit Application` : undefined;
  const application = getApplicationBySlug(appSlug?.toString() || "");

  // state
  const { data, isLoading } = useSWR(
    appSlug ? APPLICATION_DETAILS(appSlug.toString()) : null,
    appSlug ? async () => fetchApplication(appSlug.toString()) : null
  );

  useSWR(APPLICATION_CATEGORIES_LIST(), async () => fetchApplicationCategories());

  const handleFormSubmit = async (data: Partial<TApplication>): Promise<TApplication | undefined> => {
    try {
      if (!data || !application) return;
      const res = await updateApplication(application.slug, data);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success",
        message: "Application updated successfully",
      });
      return res;
    } catch (error) {
      console.error(error);
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error",
        message: "Failed to update application",
      });
      return undefined;
    }
  };

  if (!data || !application || isLoading) {
    return <EmailSettingsLoader />;
  }

  if (workspaceUserInfo && !canPerformWorkspaceAdminActions) {
    return <NotAuthorizedView section="settings" />;
  }

  return (
    <>
      <PageHead title={pageTitle} />
      <CreateUpdateApplication formData={application} handleFormSubmit={handleFormSubmit} />
    </>
  );
});

export default ApplicationEditPage;
