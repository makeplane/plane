/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { PagesOutline } from "@makeplane/propel/icons";
import { useTranslation } from "@plane/i18n";
import type { BreadcrumbNavigationItem } from "@plane/blocks/breadcrumb";
import { Breadcrumbs, BreadcrumbNavigationSelect } from "@plane/blocks/breadcrumb";
import { Header } from "@plane/blocks/layout";
import { getPageName } from "@plane/utils";
// components
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
import { PageAccessIcon } from "@/components/common/page-access-icon";
import { SwitcherIcon, SwitcherLabel } from "@/components/common/switcher-label";
import { PageHeaderActions } from "@/components/pages/header/actions";
import { PageSyncingBadge } from "@/components/pages/header/syncing-badge";
import { CommonProjectBreadcrumbs } from "@/components/breadcrumbs/common";
import { useProjectCrumbProps } from "@/components/breadcrumbs/use-project-crumb-props";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useAppRouter } from "@/hooks/use-app-router";
import { EPageStoreType, usePage, usePageStore } from "@/hooks/store";

export interface IPagesHeaderProps {
  showButton?: boolean;
}

const storeType = EPageStoreType.PROJECT;

export const PageDetailsHeader = observer(function PageDetailsHeader() {
  // plane hooks
  const { t } = useTranslation();
  // router
  const router = useAppRouter();
  const { workspaceSlug, pageId, projectId } = useParams();
  const projectCrumb = useProjectCrumbProps(workspaceSlug?.toString(), projectId?.toString());
  // store hooks
  const { loader } = useProject();
  const { getPageById, getCurrentProjectPageIds } = usePageStore(storeType);
  const page = usePage({
    pageId: pageId?.toString() ?? "",
    storeType,
  });
  // derived values
  const projectPageIds = getCurrentProjectPageIds(projectId?.toString());

  const switcherOptions = projectPageIds
    .map<BreadcrumbNavigationItem | undefined>((id) => {
      const _page = id === pageId ? page : getPageById(id);
      if (!_page?.id) return;
      return {
        key: _page.id,
        label: getPageName(_page.name),
        content: (
          <div className="flex items-center justify-between gap-2">
            <SwitcherLabel logo_props={_page.logo_props} name={getPageName(_page.name)} LabelIcon={PagesOutline} />
            <PageAccessIcon {..._page} />
          </div>
        ),
      };
    })
    .filter((option) => option !== undefined);

  if (!page) return null;

  return (
    <Header>
      <Header.LeftItem>
        <div>
          <Breadcrumbs isLoading={loader === "init-loader"}>
            <CommonProjectBreadcrumbs
              workspaceSlug={workspaceSlug?.toString()}
              projectId={projectId?.toString()}
              {...projectCrumb}
            />
            <Breadcrumbs.Item
              component={
                <BreadcrumbLink
                  label="Pages"
                  href={`/${workspaceSlug}/projects/${projectId}/pages/`}
                  icon={<PagesOutline className="h-4 w-4 text-tertiary" />}
                />
              }
            />

            <Breadcrumbs.Item
              component={
                <BreadcrumbNavigationSelect
                  selectedItemKey={pageId?.toString() ?? ""}
                  navigationItems={switcherOptions}
                  onChange={(value: string) => {
                    router.push(`/${workspaceSlug}/projects/${projectId}/pages/${value}`);
                  }}
                  label={getPageName(page?.name)}
                  icon={<SwitcherIcon logo_props={page.logo_props} LabelIcon={PagesOutline} size={16} />}
                  placeholder={t("pages")}
                  searchPlaceholder={t("common.search.label")}
                  emptyMessage={t("common.search.no_matches_found")}
                  isLast
                />
              }
              isLast
            />
          </Breadcrumbs>
        </div>
      </Header.LeftItem>
      <Header.RightItem>
        <PageSyncingBadge syncStatus={page.isSyncingWithServer} />
        <PageHeaderActions page={page} storeType={storeType} />
      </Header.RightItem>
    </Header>
  );
});
