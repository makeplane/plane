"use client";

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { FileText } from "lucide-react";
// constants
import { EPageAccess } from "@plane/constants";
// plane types
import { TPage } from "@plane/types";
// plane ui
import { Breadcrumbs, Button, Header, setToast, TOAST_TYPE } from "@plane/ui";
// helpers
import { BreadcrumbLink } from "@/components/common";
// hooks
import { useEventTracker, useProject } from "@/hooks/store";
// plane web
import { ProjectBreadcrumb } from "@/plane-web/components/breadcrumbs";
// plane web hooks
import { EPageStoreType, usePageStore } from "@/plane-web/hooks/store";

export const PagesListHeader = observer(() => {
  // states
  const [isCreatingPage, setIsCreatingPage] = useState(false);
  // router
  const router = useRouter();
  const { workspaceSlug } = useParams();
  const searchParams = useSearchParams();
  const pageType = searchParams.get("type");
  // store hooks
  const { currentProjectDetails, loader } = useProject();
  const { canCurrentUserCreatePage, createPage } = usePageStore(EPageStoreType.PROJECT);
  const { setTrackElement } = useEventTracker();
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
          <Breadcrumbs isLoading={loader === "init-loader"}>
            <ProjectBreadcrumb />
            <Breadcrumbs.BreadcrumbItem
              type="text"
              link={<BreadcrumbLink label="Pages" icon={<FileText className="h-4 w-4 text-custom-text-300" />} />}
            />
          </Breadcrumbs>
        </div>
      </Header.LeftItem>
      {canCurrentUserCreatePage ? (
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
