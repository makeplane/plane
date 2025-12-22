import { observer } from "mobx-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
// constants
import { EPageAccess, PROJECT_PAGE_TRACKER_EVENTS, PROJECT_TRACKER_ELEMENTS } from "@plane/constants";
// plane types
import { Button } from "@plane/propel/button";
import { PageIcon } from "@plane/propel/icons";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TPage } from "@plane/types";
// plane ui
import { Breadcrumbs, Header } from "@plane/ui";
// helpers
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
import { captureError } from "@/helpers/event-tracker.helper";
// hooks
import { useProject } from "@/hooks/store/use-project";
// plane web imports
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUser, useUserPermissions } from "@/hooks/store/user";
import { CommonProjectBreadcrumbs } from "@/plane-web/components/breadcrumbs/common";
import { trackPageCreated } from "@/plane-web/helpers/event-tracker-v2.helper";
import { EPageStoreType, usePageStore } from "@/plane-web/hooks/store";

export const PagesListHeader = observer(function PagesListHeader() {
  // states
  const [isCreatingPage, setIsCreatingPage] = useState(false);
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = useParams();
  const searchParams = useSearchParams();
  const pageType = searchParams.get("type");
  // store hooks
  const { getWorkspaceRoleByWorkspaceSlug } = useUserPermissions();
  const { data: currentUser } = useUser();
  const { currentWorkspace } = useWorkspace();
  const { currentProjectDetails, loader } = useProject();
  const { canCurrentUserCreatePage, createPage } = usePageStore(EPageStoreType.PROJECT);
  // handle page create
  const handleCreatePage = async () => {
    try {
      setIsCreatingPage(true);

      const payload: Partial<TPage> = {
        access: pageType === "private" ? EPageAccess.PRIVATE : EPageAccess.PUBLIC,
      };

      const pageData = await createPage(payload);
      if (!pageData?.id) throw new Error("Invalid response");
      if (currentWorkspace && currentUser) {
        const role = getWorkspaceRoleByWorkspaceSlug(currentWorkspace.slug);
        trackPageCreated(
          {
            id: pageData.id,
            project_id: projectId,
            created_at: pageData.created_at ?? "",
          },
          currentWorkspace,
          currentUser,
          "project",
          role
        );
      }
      const pageId = `/${workspaceSlug}/projects/${currentProjectDetails?.id}/pages/${pageData.id}`;
      router.push(pageId);
    } catch (err: any) {
      captureError({
        eventName: PROJECT_PAGE_TRACKER_EVENTS.create,
        payload: {
          state: "ERROR",
          error: err?.data?.error,
        },
      });
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: err?.data?.error || "Page could not be created. Please try again.",
      });
    } finally {
      setIsCreatingPage(false);
    }
  };

  return (
    <Header>
      <Header.LeftItem>
        <Breadcrumbs isLoading={loader === "init-loader"}>
          <CommonProjectBreadcrumbs workspaceSlug={workspaceSlug?.toString()} projectId={projectId?.toString()} />
          <Breadcrumbs.Item
            component={
              <BreadcrumbLink
                label="Pages"
                href={`/${workspaceSlug}/projects/${currentProjectDetails?.id}/pages/`}
                icon={<PageIcon className="h-4 w-4 text-custom-text-300" />}
                isLast
              />
            }
            isLast
          />
        </Breadcrumbs>
      </Header.LeftItem>
      {canCurrentUserCreatePage ? (
        <Header.RightItem>
          <Button
            variant="primary"
            size="sm"
            onClick={handleCreatePage}
            loading={isCreatingPage}
            data-ph-element={PROJECT_TRACKER_ELEMENTS.CREATE_HEADER_BUTTON}
          >
            {isCreatingPage ? "Adding" : "Add page"}
          </Button>
        </Header.RightItem>
      ) : (
        <></>
      )}
    </Header>
  );
});
