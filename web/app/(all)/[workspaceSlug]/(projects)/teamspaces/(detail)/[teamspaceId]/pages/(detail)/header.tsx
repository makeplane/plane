"use client";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { FileText } from "lucide-react";
// plane imports
import { ICustomSearchSelectOption } from "@plane/types";
import { Breadcrumbs, CustomSearchSelect, Header, Loader, TeamsIcon } from "@plane/ui";
import { getPageName  } from "@plane/utils";
// components
import { BreadcrumbLink, Logo, PageAccessIcon, SwitcherLabel } from "@/components/common";
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
  const { getTeamspacePageIds, getPageById } = usePageStore(storeType);
  const page = usePage({
    pageId: pageId?.toString() ?? "",
    storeType,
  });
  // derived values
  const teamspace = getTeamspaceById(teamspaceId?.toString());
  const teamspacePageIds = getTeamspacePageIds(teamspaceId?.toString());

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

  if (!workspaceSlug || !page) return;

  return (
    <Header>
      <Header.LeftItem>
        <div className="flex items-center gap-4">
          {/* bread crumps */}
          <Breadcrumbs>
            <Breadcrumbs.BreadcrumbItem
              type="text"
              link={
                <BreadcrumbLink
                  href={`/${workspaceSlug}/teamspaces`}
                  label="Teamspaces"
                  icon={<TeamsIcon className="h-4 w-4 text-custom-text-300" />}
                />
              }
            />
            <Breadcrumbs.BreadcrumbItem
              type="text"
              link={
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
            <Breadcrumbs.BreadcrumbItem
              type="text"
              link={
                <BreadcrumbLink
                  href={`/${workspaceSlug}/teamspaces/${teamspaceId}/pages`}
                  label="Pages"
                  icon={<FileText className="h-4 w-4 text-custom-text-300" />}
                />
              }
            />
            <Breadcrumbs.BreadcrumbItem
              type="component"
              component={
                <CustomSearchSelect
                  value={pageId}
                  options={switcherOptions}
                  label={
                    <SwitcherLabel logo_props={page?.logo_props} name={getPageName(page?.name)} LabelIcon={FileText} />
                  }
                  onChange={(value: string) => {
                    router.push(`/${workspaceSlug}/teamspaces/${teamspaceId}/pages/${value}`);
                  }}
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
