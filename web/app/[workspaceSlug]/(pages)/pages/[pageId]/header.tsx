"use client";

import { useMemo, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { FileText, ChevronRight } from "lucide-react";
// constants
import { EUserWorkspaceRoles, EUserPermissionsLevel } from "@plane/constants";
// types
import { TPage } from "@plane/types";
// ui
import { Button, CustomMenu, Header } from "@plane/ui";
// components
import { BreadcrumbLink } from "@/components/common";
import { PageBreadcrumbItem } from "@/components/pages";
// helpers
import { SPACE_BASE_PATH, SPACE_BASE_URL } from "@/helpers/common.helper";
import { getPageName } from "@/helpers/page.helper";
// hooks
import { useUserPermissions } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
// plane web components
import { PublishPageModal, CollaboratorsList } from "@/plane-web/components/pages";
// plane web hooks
import { EPageStoreType, usePage, usePageStore, usePublishPage } from "@/plane-web/hooks/store";

export interface IPagesHeaderProps {
  showButton?: boolean;
}

export const PageDetailsHeader = observer(() => {
  // states
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  // params
  const { workspaceSlug, pageId } = useParams();
  const router = useAppRouter();
  // store hooks
  const { allowPermissions } = useUserPermissions();
  const { fetchParentPages } = usePageStore(EPageStoreType.WORKSPACE);
  const page = usePage({
    pageId: pageId?.toString() ?? "",
    storeType: EPageStoreType.WORKSPACE,
  });
  const { fetchWorkspacePagePublishSettings, getPagePublishSettings, publishWorkspacePage, unpublishWorkspacePage } =
    usePublishPage();
  const { anchor, isCurrentUserOwner } = page ?? {};
  // derived values
  const isDeployed = !!anchor;
  const pagePublishSettings = getPagePublishSettings(pageId.toString());
  const isPublishAllowed =
    isCurrentUserOwner || allowPermissions([EUserWorkspaceRoles.ADMIN], EUserPermissionsLevel.WORKSPACE);

  // Always fetch parent pages to keep the cache up-to-date
  const { data: parentPagesList, isLoading: isParentPagesLoading } = useSWR(
    workspaceSlug && pageId ? `WORKSPACE_PARENT_PAGES_LIST_${pageId.toString()}` : null,
    workspaceSlug && pageId ? () => fetchParentPages(pageId.toString()) : null
  );

  // Transform the data once it's available using useMemo
  const orderedParentPages = useMemo(() => {
    if (!parentPagesList) return undefined;
    return createOrderedParentChildArray(parentPagesList);
  }, [parentPagesList]);

  // Now use orderedParentPages instead of parentPagesList for your UI logic
  const isRootPage = orderedParentPages?.length === 1;
  const rootParentDetails = orderedParentPages?.[0]; // First item is the root
  const middleParents = orderedParentPages?.slice(1, -1) ?? []; // Middle items (excluding root and current)

  const SPACE_APP_URL = SPACE_BASE_URL.trim() === "" ? window.location.origin : SPACE_BASE_URL;
  const publishLink = `${SPACE_APP_URL}${SPACE_BASE_PATH}/pages/${anchor}`;

  const isPageLoading = page === undefined;

  const BreadcrumbSeparator = () => (
    <div className="flex items-center px-2 text-custom-text-300">
      <ChevronRight className="size-3" />
    </div>
  );

  return (
    <>
      <PublishPageModal
        anchor={anchor}
        fetchPagePublishSettings={async () => await fetchWorkspacePagePublishSettings(pageId.toString())}
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        pagePublishSettings={pagePublishSettings}
        publishPage={(data) => publishWorkspacePage(pageId.toString(), data)}
        unpublishPage={() => unpublishWorkspacePage(pageId.toString())}
      />
      <Header>
        <Header.LeftItem>
          <div className="w-full overflow-hidden">
            <div className="flex items-center">
              <div>
                <BreadcrumbLink
                  href={`/${workspaceSlug}/pages`}
                  label="Pages"
                  icon={<FileText className="size-4 text-custom-text-300" />}
                />
              </div>

              {isParentPagesLoading ? (
                <div className="flex items-center">
                  <BreadcrumbSeparator />
                  <div className="flex items-center animate-pulse">
                    <div className="h-4 w-24 bg-custom-background-80 rounded" />
                  </div>
                </div>
              ) : (
                <>
                  {!isRootPage && rootParentDetails?.id && (
                    <div className="flex items-center">
                      <BreadcrumbSeparator />
                      <PageBreadcrumbItem
                        pageId={rootParentDetails.id}
                        storeType={EPageStoreType.WORKSPACE}
                        href={`/${workspaceSlug}/pages/${rootParentDetails.id}`}
                      />
                    </div>
                  )}

                  {middleParents.length > 0 && (
                    <div className="flex items-center">
                      <BreadcrumbSeparator />
                      <CustomMenu placement="bottom-start" ellipsis>
                        {middleParents.map(
                          (parent, index) =>
                            parent.id && (
                              <div
                                key={parent.id}
                                style={{
                                  paddingLeft: `${index * 16}px`,
                                }}
                              >
                                <CustomMenu.MenuItem
                                  className="flex items-center gap-1 transition-colors duration-200 ease-in-out"
                                  onClick={() => router.push(`/${workspaceSlug}/pages/${parent.id}`)}
                                >
                                  <PageBreadcrumbItem
                                    pageId={parent.id}
                                    storeType={EPageStoreType.WORKSPACE}
                                    showLogo
                                  />
                                </CustomMenu.MenuItem>
                              </div>
                            )
                        )}
                      </CustomMenu>
                    </div>
                  )}
                </>
              )}

              <div className={`flex items-center animate-quickFadeIn`}>
                <BreadcrumbSeparator />
                <PageBreadcrumbItem pageId={pageId?.toString() ?? ""} storeType={EPageStoreType.WORKSPACE} />
              </div>
            </div>
          </div>
        </Header.LeftItem>
        <Header.RightItem>
          <div className="flex items-center gap-2">
            <CollaboratorsList storeType={EPageStoreType.WORKSPACE} pageId={pageId?.toString() ?? ""} />
            {isPageLoading ? (
              <div className="flex items-center gap-2">
                <div className="h-7 w-16 bg-custom-background-80 rounded animate-pulse" />
                <div className="h-7 w-20 bg-custom-background-80 rounded animate-pulse" />
              </div>
            ) : (
              <>
                {isDeployed && (
                  <a
                    href={publishLink}
                    className={`px-3 py-1.5 bg-green-500/20 text-green-500 rounded text-xs font-medium flex items-center gap-1.5 
                    transition-all duration-300 ease-out hover:bg-green-500/30`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className="flex-shrink-0 rounded-full size-1.5 bg-green-500" />
                    Live
                  </a>
                )}
                {isPublishAllowed && (
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => setIsPublishModalOpen(true)}
                    className={`transition-all duration-200 hover:scale-[1.02]`}
                  >
                    {isDeployed ? "Unpublish" : "Publish"}
                  </Button>
                )}
              </>
            )}
          </div>
        </Header.RightItem>
      </Header>
    </>
  );
});

function createOrderedParentChildArray(parentPagesList: TPage[]) {
  // If the list is empty or has only one item, return it as is
  if (!parentPagesList || parentPagesList.length <= 1) {
    return parentPagesList;
  }

  // Create a map for quick lookups by ID
  const pagesMap = new Map();
  parentPagesList.forEach((page) => {
    pagesMap.set(page.id, page);
  });

  const rootPage = parentPagesList.find((page) => page.parent_id === null);

  if (!rootPage) {
    console.error("No root page found in the list");
    return parentPagesList;
  }

  const result: TPage[] = [];

  function buildHierarchy(currentPage: TPage) {
    result.push(currentPage);

    // Find all direct children of the current page
    const children = parentPagesList.filter((page) => page.parent_id === currentPage.id);

    // Process each child
    children.forEach((child) => {
      buildHierarchy(child);
    });
  }

  // Start building from the root
  buildHierarchy(rootPage);

  return result;
}
