"use client";

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { FileText } from "lucide-react";
// plane types
import { TPage } from "@plane/types";
// plane ui
import { Breadcrumbs, Button, Header, setToast, TOAST_TYPE } from "@plane/ui";
// helpers
import { BreadcrumbLink, Logo } from "@/components/common";
// constants
import { EPageAccess } from "@/constants/page";
// hooks
import { useEventTracker, useProject, useProjectPages, useUserPermissions } from "@/hooks/store";
// plane web hooks
import { EUserPermissions, EUserPermissionsLevel } from "@/plane-web/constants/user-permissions";

export const PagesListHeader = observer(() => {
  // states
  const [isCreatingPage, setIsCreatingPage] = useState(false);
  // router
  const router = useRouter();
  const { workspaceSlug } = useParams();
  const searchParams = useSearchParams();
  const pageType = searchParams.get("type");
  // store hooks
  const { allowPermissions } = useUserPermissions();

  const { currentProjectDetails, loader } = useProject();
  const { createPage } = useProjectPages();
  const { setTrackElement } = useEventTracker();
  // auth
  const canUserCreatePage = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER, EUserPermissions.GUEST],
    EUserPermissionsLevel.PROJECT
  );
  // handle page create
  const handleCreatePage = async () => {
    setIsCreatingPage(true);
    setTrackElement("Project pages page");

    const payload: Partial<TPage> = {
      access: pageType === "private" ? EPageAccess.PRIVATE : EPageAccess.PUBLIC,
    };

    await createPage(payload)
      .then((res) => {
        const pageId = `/${workspaceSlug}/projects/${currentProjectDetails?.id}/pages/${res?.id}`;
        router.push(pageId);
      })
      .catch((err) =>
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: err?.data?.error || "Page could not be created. Please try again.",
        })
      )
      .finally(() => setIsCreatingPage(false));
  };

  return (
    <Header>
      <Header.LeftItem>
        <div>
          <Breadcrumbs isLoading={loader}>
            <Breadcrumbs.BreadcrumbItem
              type="text"
              link={
                <BreadcrumbLink
                  href={`/${workspaceSlug}/projects/${currentProjectDetails?.id}/issues`}
                  label={currentProjectDetails?.name ?? "Project"}
                  icon={
                    currentProjectDetails && (
                      <span className="grid h-4 w-4 flex-shrink-0 place-items-center">
                        <Logo logo={currentProjectDetails?.logo_props} size={16} />
                      </span>
                    )
                  }
                />
              }
            />
            <Breadcrumbs.BreadcrumbItem
              type="text"
              link={<BreadcrumbLink label="Pages" icon={<FileText className="h-4 w-4 text-custom-text-300" />} />}
            />
          </Breadcrumbs>
        </div>
      </Header.LeftItem>
      {canUserCreatePage ? (
        <Header.RightItem>
          <Button variant="primary" size="sm" onClick={handleCreatePage} loading={isCreatingPage}>
            {isCreatingPage ? "Adding" : "Add page"}
          </Button>
        </Header.RightItem>
      ) : (
        <></>
      )}
    </Header>
  );
});
