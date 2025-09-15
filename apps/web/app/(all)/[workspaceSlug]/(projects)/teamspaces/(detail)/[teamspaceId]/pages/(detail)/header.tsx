"use client";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { FileText, ChevronRight } from "lucide-react";
// plane imports
import { TeamsIcon } from "@plane/propel/icons";
import { ICustomSearchSelectOption } from "@plane/types";
import { BreadcrumbNavigationSearchDropdown, Breadcrumbs, Header, Loader, CustomMenu } from "@plane/ui";
import { getPageName } from "@plane/utils";
// components
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
import { Logo } from "@/components/common/logo";
import { PageAccessIcon } from "@/components/common/page-access-icon";
import { SwitcherLabel } from "@/components/common/switcher-label";
import { PageBreadcrumbItem } from "@/components/pages/editor/breadcrumb-page-item";
import { PageHeaderActions } from "@/components/pages/header/actions";
// helpers
import { PageSyncingBadge } from "@/components/pages/header/syncing-badge";
// plane web hooks
import { useAppRouter } from "@/hooks/use-app-router";
// plane web components
import { CollaboratorsList } from "@/plane-web/components/pages";
// plane web hooks
import { useTeamspaces, usePage, EPageStoreType, usePageStore } from "@/plane-web/hooks/store";

const storeType = EPageStoreType.TEAMSPACE;

export const TeamspacePageDetailHeader: React.FC = observer(() => {
  // router
  const { workspaceSlug, teamspaceId, pageId } = useParams();
  const router = useAppRouter();
  // store hooks
  const { loader, getTeamspaceById } = useTeamspaces();
  const { getCurrentTeamspacePageIds, getPageById, fetchParentPages, getOrderedParentPages, isNestedPagesEnabled } =
    usePageStore(storeType);
  const page = usePage({
    pageId: pageId?.toString() ?? "",
    storeType,
  });
  // derived values
  const teamspace = getTeamspaceById(teamspaceId?.toString());
  const teamspacePageIds = getCurrentTeamspacePageIds(teamspaceId?.toString());

  // Always fetch parent pages to keep the cache up-to-date
  const { isLoading: isParentPagesLoading } = useSWR(
    workspaceSlug && teamspaceId && pageId ? `TEAMSPACE_PARENT_PAGES_LIST_${pageId.toString()}` : null,
    workspaceSlug && teamspaceId && pageId ? () => fetchParentPages(pageId.toString()) : null
  );

  // Get ordered parent pages from store
  const orderedParentPages = pageId ? getOrderedParentPages(pageId.toString()) : undefined;

  // Now use orderedParentPages from store for UI logic
  const isRootPage = orderedParentPages?.length === 1;
  const rootParentDetails = orderedParentPages?.[0]; // First item is the root
  const middleParents = orderedParentPages?.slice(1, -1) ?? []; // Middle items (excluding root and current)

  const BreadcrumbSeparator = () => (
    <div className="flex items-center px-2 text-custom-text-300">
      <ChevronRight className="size-3" />
    </div>
  );

  const switcherOptions = teamspacePageIds
    ?.map((id) => {
      const _page = id === pageId ? page : getPageById(id);
      if (!_page) return;
      return {
        value: _page.id,
        query: _page.name,
        content: (
          <div className="flex gap-2 items-center justify-between">
            <SwitcherLabel logo_props={_page.logo_props} name={getPageName(_page.name)} LabelIcon={FileText} />
            <PageAccessIcon {..._page} />
          </div>
        ),
      };
    })
    .filter((option) => option !== undefined) as ICustomSearchSelectOption[];

  if (!workspaceSlug || !page || !page.canCurrentUserAccessPage) return;

  return (
    <Header>
      <Header.LeftItem>
        <div className="w-full overflow-hidden">
          <Breadcrumbs isLoading={loader === "init-loader"}>
            <Breadcrumbs.Item
              component={
                <BreadcrumbLink
                  href={`/${workspaceSlug}/teamspaces`}
                  label="Teamspaces"
                  icon={<TeamsIcon className="h-4 w-4 text-custom-text-300" />}
                />
              }
            />
            <Breadcrumbs.Item
              component={
                <>
                  {loader === "init-loader" ? (
                    <Loader.Item height="20px" width="140px" />
                  ) : teamspace ? (
                    <BreadcrumbLink
                      href={`/${workspaceSlug}/teamspaces/${teamspaceId}`}
                      label={teamspace.name}
                      icon={teamspace.logo_props && <Logo logo={teamspace.logo_props} />}
                    />
                  ) : null}
                </>
              }
            />
            <Breadcrumbs.Item
              component={
                <BreadcrumbLink
                  href={`/${workspaceSlug}/teamspaces/${teamspaceId}/pages`}
                  label="Pages"
                  icon={<FileText className="h-4 w-4 text-custom-text-300" />}
                />
              }
            />
            {isNestedPagesEnabled(workspaceSlug?.toString()) && (
              <>
                {isParentPagesLoading ? (
                  <div className="flex items-center">
                    <div className="flex items-center animate-pulse">
                      <div className="h-4 w-24 bg-custom-background-80 rounded" />
                    </div>
                  </div>
                ) : (
                  <>
                    {!isRootPage && rootParentDetails?.id && (
                      <div className="flex items-center">
                        <PageBreadcrumbItem
                          pageId={rootParentDetails.id}
                          storeType={storeType}
                          href={`/${workspaceSlug}/teamspaces/${teamspaceId}/pages/${rootParentDetails.id}`}
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
                                    onClick={() =>
                                      router.push(`/${workspaceSlug}/teamspaces/${teamspaceId}/pages/${parent.id}`)
                                    }
                                  >
                                    <PageBreadcrumbItem pageId={parent.id} storeType={storeType} showLogo />
                                  </CustomMenu.MenuItem>
                                </div>
                              )
                          )}
                        </CustomMenu>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
            {orderedParentPages && orderedParentPages.length > 1 && <BreadcrumbSeparator />}
            <Breadcrumbs.Item
              component={
                <BreadcrumbNavigationSearchDropdown
                  selectedItem={pageId?.toString() ?? ""}
                  navigationItems={switcherOptions}
                  onChange={(value: string) => {
                    router.push(`/${workspaceSlug}/teamspaces/${teamspaceId}/pages/${value}`);
                  }}
                  title={getPageName(page?.name)}
                  icon={
                    <Breadcrumbs.Icon>
                      <FileText className="size-4 flex-shrink-0 text-custom-text-300" />
                    </Breadcrumbs.Icon>
                  }
                  isLast
                />
              }
            />
          </Breadcrumbs>
        </div>
      </Header.LeftItem>
      <Header.RightItem>
        <PageSyncingBadge syncStatus={page.isSyncingWithServer} />
        <CollaboratorsList page={page} className="bottom-1" />
        <PageHeaderActions page={page} storeType={storeType} />
      </Header.RightItem>
    </Header>
  );
});
