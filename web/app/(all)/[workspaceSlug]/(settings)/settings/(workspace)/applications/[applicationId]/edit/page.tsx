"use client";

import { observer } from "mobx-react";

// component
import Link from "next/link";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { ChevronLeft, ChevronLeftIcon } from "lucide-react";
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { TApplication } from "@plane/types";
import { Breadcrumbs, setToast, TOAST_TYPE } from "@plane/ui";
import { NotAuthorizedView } from "@/components/auth-screens";
import { BreadcrumbLink } from "@/components/common";
import { PageHead } from "@/components/core";
// hooks
import { EmailSettingsLoader } from "@/components/ui";
import { APPLICATION_CATEGORIES_LIST, APPLICATION_DETAILS } from "@/constants/fetch-keys";
import { useUserPermissions, useWorkspace } from "@/hooks/store";
// plane web components
import { CreateUpdateApplication } from "@/plane-web/components/marketplace";
import { useApplications } from "@/plane-web/hooks/store";

const ApplicationEditPage = observer(() => {
  // store hooks
  const { workspaceUserInfo, allowPermissions } = useUserPermissions();
  const { currentWorkspace } = useWorkspace();
  const { applicationId, workspaceSlug } = useParams();
  const { updateApplication, getApplicationById, fetchApplication, fetchApplicationCategories } = useApplications();

  // derived values
  const canPerformWorkspaceAdminActions = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE);
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace.name} - Edit Application` : undefined;
  const application = getApplicationById(applicationId?.toString() || "");

  // state
  const { data, isLoading } = useSWR(
    applicationId ? APPLICATION_DETAILS(applicationId.toString()) : null,
    applicationId ? async () => fetchApplication(applicationId.toString()) : null
  );

  const { data: categories } = useSWR(APPLICATION_CATEGORIES_LIST(), async () => fetchApplicationCategories());

  const handleFormSubmit = async (data: Partial<TApplication>): Promise<TApplication | undefined> => {
    try {
      if (!data || !applicationId) return;
      const res = await updateApplication(applicationId?.toString(), data);
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
