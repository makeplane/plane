"use client";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArchiveIcon, Earth, FileText, Lock } from "lucide-react";
// types
import { EPageAccess } from "@plane/constants";
import { ICustomSearchSelectOption, TPage } from "@plane/types";
// ui
import { Breadcrumbs, Header, CustomSearchSelect } from "@plane/ui";
// components
import { BreadcrumbLink, SwitcherLabel } from "@/components/common";
import { PageEditInformationPopover } from "@/components/pages";
// helpers
// hooks
import { getPageName } from "@/helpers/page.helper";
import { useProject } from "@/hooks/store";
// plane web components
import { ProjectBreadcrumb } from "@/plane-web/components/breadcrumbs";
import { PageDetailsHeaderExtraActions } from "@/plane-web/components/pages";
// plane web hooks
import { EPageStoreType, usePage, usePageStore } from "@/plane-web/hooks/store";

const PageAccessIcon = (page: TPage) => (
  <div>
    {page.archived_at ? (
      <ArchiveIcon className="h-2.5 w-2.5 text-custom-text-300" />
    ) : page.access === EPageAccess.PUBLIC ? (
      <Earth className="h-2.5 w-2.5 text-custom-text-300" />
    ) : (
      <Lock className="h-2.5 w-2.5 text-custom-text-300" />
    )}
  </div>
);

export interface IPagesHeaderProps {
  showButton?: boolean;
}

export const PageDetailsHeader = observer(() => {
  // router
  const { workspaceSlug, pageId, projectId } = useParams();
  // store hooks
  const { currentProjectDetails, loader } = useProject();
  const page = usePage({
    pageId: pageId?.toString() ?? "",
    storeType: EPageStoreType.PROJECT,
  });
  const { getPageById, getCurrentProjectPageIds } = usePageStore(EPageStoreType.PROJECT);
  // derived values
  const projectPageIds = getCurrentProjectPageIds(projectId?.toString());

  if (!page) return null;
  const switcherOptions = projectPageIds
    .map((id) => {
      const _page = id === pageId ? page : getPageById(id);
      if (!_page) return;
      const pageLink = `/${workspaceSlug}/projects/${projectId}/pages/${_page.id}`;
      return {
        value: _page.id,
        query: _page.name,
        content: (
          <div className="flex gap-2 items-center justify-between">
            <Link href={pageLink} className="flex gap-2 items-center justify-between w-full">
              <SwitcherLabel logo_props={_page.logo_props} name={getPageName(_page.name)} LabelIcon={FileText} />
            </Link>
            <PageAccessIcon {..._page} />
          </div>
        ),
      };
    })
    .filter((option) => option !== undefined) as ICustomSearchSelectOption[];

  if (!page) return null;

  return (
    <Header>
      <Header.LeftItem>
        <div>
          <Breadcrumbs isLoading={loader === "init-loader"}>
            <Breadcrumbs.BreadcrumbItem
              type="text"
              link={
                <span>
                  <span className="hidden md:block">
                    <ProjectBreadcrumb />
                  </span>
                  <span className="md:hidden">
                    <BreadcrumbLink
                      href={`/${workspaceSlug}/projects/${currentProjectDetails?.id}/issues`}
                      label={"..."}
                    />
                  </span>
                </span>
              }
            />

            <Breadcrumbs.BreadcrumbItem
              type="text"
              link={
                <BreadcrumbLink
                  href={`/${workspaceSlug}/projects/${currentProjectDetails?.id}/pages`}
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
                    <SwitcherLabel logo_props={page.logo_props} name={getPageName(page.name)} LabelIcon={FileText} />
                  }
                  onChange={() => {}}
                />
              }
            />
          </Breadcrumbs>
        </div>
      </Header.LeftItem>
      <Header.RightItem>
        <PageEditInformationPopover page={page} />
        <PageDetailsHeaderExtraActions page={page} />
      </Header.RightItem>
    </Header>
  );
});
