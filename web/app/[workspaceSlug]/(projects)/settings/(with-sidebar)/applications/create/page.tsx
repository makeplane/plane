"use client"

import { observer } from "mobx-react";

// component
import { useParams } from "next/navigation";
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { TUserApplication } from "@plane/types";
import { Breadcrumbs, setToast, TOAST_TYPE } from "@plane/ui";
import { NotAuthorizedView } from "@/components/auth-screens";
import { BreadcrumbLink } from "@/components/common";
import { PageHead } from "@/components/core";
import { getAssetIdFromUrl } from "@/helpers/file.helper";
// hooks
import { useUserPermissions, useWorkspace } from "@/hooks/store";
// plane web components
import { CreateUpdateApplication } from "@/plane-web/components/marketplace";
import { useApplications } from "@/plane-web/hooks/store";

const ApplicationCreatePage = observer(() => {
  // store hooks
  const { workspaceUserInfo, allowPermissions } = useUserPermissions();
  const { currentWorkspace } = useWorkspace();
  const { createApplication } = useApplications();
  const { workspaceSlug } = useParams();
  // derived values
  const canPerformWorkspaceAdminActions = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE);
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace.name} - Create Application` : undefined;

  // state

  const handleFormSubmit = async (data: Partial<TUserApplication>) => {
    try {
      if (!data) return;
      if (data.logo_url) {
        data.logo_asset = getAssetIdFromUrl(data.logo_url);
      }
      const response = await createApplication(data);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success",
        message: "Application created successfully",
      });
      return response;
    } catch (error) {
      console.error(error);
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error",
        message: "Failed to create application",
      });
    }
  };

  if (workspaceUserInfo && !canPerformWorkspaceAdminActions) {
    return <NotAuthorizedView section="settings" />;
  }


  return (
    <>
      <PageHead title={pageTitle} />
      <div>
          <Breadcrumbs>
            <Breadcrumbs.BreadcrumbItem
              type="text"
              link={
                <BreadcrumbLink
                  href={`/${workspaceSlug}/settings/applications`}
                  label="Applications"
                />
              }
            />
            <Breadcrumbs.BreadcrumbItem
              type="text"
              link={<BreadcrumbLink label={`Add Details`} />}
            />
          </Breadcrumbs>
        </div>
      <CreateUpdateApplication handleFormSubmit={handleFormSubmit} />
    </>
  );
});


export default ApplicationCreatePage;