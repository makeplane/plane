import { useCallback, useMemo, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import {
  EIssueFilterType,
  ISSUE_DISPLAY_FILTERS_BY_PAGE,
  GLOBAL_VIEW_TRACKER_ELEMENTS,
  DEFAULT_GLOBAL_VIEWS_LIST,
} from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { ViewsIcon } from "@plane/propel/icons";
import type { IIssueDisplayFilterOptions, IIssueDisplayProperties, ICustomSearchSelectOption } from "@plane/types";
import { EIssuesStoreType, EIssueLayoutTypes } from "@plane/types";
import { Breadcrumbs, Header, BreadcrumbNavigationSearchDropdown } from "@plane/ui";
// components
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
import { SwitcherLabel } from "@/components/common/switcher-label";
import { DisplayFiltersSelection, FiltersDropdown } from "@/components/issues/issue-layouts/filters";
import { WorkItemFiltersToggle } from "@/components/work-item-filters/filters-toggle";
import { DefaultWorkspaceViewQuickActions } from "@/components/workspace/views/default-view-quick-action";
import { CreateUpdateWorkspaceViewModal } from "@/components/workspace/views/modal";
import { WorkspaceViewQuickActions } from "@/components/workspace/views/quick-action";
// hooks
import { useGlobalView } from "@/hooks/store/use-global-view";
import { useIssues } from "@/hooks/store/use-issues";
import { useAppRouter } from "@/hooks/use-app-router";
import { GlobalViewLayoutSelection } from "@/plane-web/components/views/helper";

export const GlobalIssuesHeader = observer(function GlobalIssuesHeader() {
  // states
  const [createViewModal, setCreateViewModal] = useState(false);
  // router
  const router = useAppRouter();
  const { workspaceSlug, globalViewId: routerGlobalViewId } = useParams();
  const globalViewId = routerGlobalViewId ? routerGlobalViewId.toString() : undefined;
  // store hooks
  const {
    issuesFilter: { filters, updateFilters },
  } = useIssues(EIssuesStoreType.GLOBAL);
  const { getViewDetailsById, currentWorkspaceViews } = useGlobalView();
  const { t } = useTranslation();

  const issueFilters = globalViewId ? filters[globalViewId.toString()] : undefined;

  const activeLayout = issueFilters?.displayFilters?.layout;
  const viewDetails = globalViewId ? getViewDetailsById(globalViewId) : undefined;

  const handleDisplayFilters = useCallback(
    (updatedDisplayFilter: Partial<IIssueDisplayFilterOptions>) => {
      if (!workspaceSlug || !globalViewId) return;
      updateFilters(
        workspaceSlug.toString(),
        undefined,
        EIssueFilterType.DISPLAY_FILTERS,
        updatedDisplayFilter,
        globalViewId
      );
    },
    [workspaceSlug, updateFilters, globalViewId]
  );

  const handleDisplayProperties = useCallback(
    (property: Partial<IIssueDisplayProperties>) => {
      if (!workspaceSlug || !globalViewId) return;
      updateFilters(workspaceSlug.toString(), undefined, EIssueFilterType.DISPLAY_PROPERTIES, property, globalViewId);
    },
    [workspaceSlug, updateFilters, globalViewId]
  );

  const handleLayoutChange = useCallback(
    (layout: EIssueLayoutTypes) => {
      if (!workspaceSlug || !globalViewId) return;
      updateFilters(
        workspaceSlug.toString(),
        undefined,
        EIssueFilterType.DISPLAY_FILTERS,
        { layout: layout },
        globalViewId
      );
    },
    [workspaceSlug, updateFilters, globalViewId]
  );

  const isLocked = viewDetails?.is_locked;

  const isDefaultView = DEFAULT_GLOBAL_VIEWS_LIST.find((view) => view.key === globalViewId);

  const defaultViewDetails = DEFAULT_GLOBAL_VIEWS_LIST.find((view) => view.key === globalViewId);

  const defaultOptions = DEFAULT_GLOBAL_VIEWS_LIST.map((view) => ({
    value: view.key,
    query: view.key,
    content: <SwitcherLabel name={t(view.i18n_label)} LabelIcon={ViewsIcon} />,
  }));

  const workspaceOptions = (currentWorkspaceViews || []).map((view) => {
    const _view = getViewDetailsById(view);
    if (!_view) return;
    return {
      value: _view.id,
      query: _view.name,
      content: <SwitcherLabel name={_view.name} LabelIcon={ViewsIcon} />,
    };
  });

  const switcherOptions = [...defaultOptions, ...workspaceOptions].filter(
    (option) => option !== undefined
  ) as ICustomSearchSelectOption[];
  const currentLayoutFilters = useMemo(() => {
    const layout = activeLayout ?? EIssueLayoutTypes.SPREADSHEET;
    return ISSUE_DISPLAY_FILTERS_BY_PAGE.my_issues.layoutOptions[layout];
  }, [activeLayout]);

  return (
    <>
      <CreateUpdateWorkspaceViewModal isOpen={createViewModal} onClose={() => setCreateViewModal(false)} />
      <Header>
        <Header.LeftItem>
          <Breadcrumbs>
            <Breadcrumbs.Item
              component={<BreadcrumbLink label={t("views")} icon={<ViewsIcon className="h-4 w-4 text-tertiary" />} />}
            />
            <Breadcrumbs.Item
              component={
                <BreadcrumbNavigationSearchDropdown
                  selectedItem={globalViewId?.toString() || ""}
                  navigationItems={switcherOptions}
                  onChange={(value: string) => {
                    router.push(`/${workspaceSlug}/workspace-views/${value}`);
                  }}
                  title={viewDetails?.name ?? t(defaultViewDetails?.i18n_label ?? "")}
                  icon={
                    <Breadcrumbs.Icon>
                      <ViewsIcon className="size-4 flex-shrink-0 text-tertiary" />
                    </Breadcrumbs.Icon>
                  }
                  isLast
                />
              }
              isLast
            />
          </Breadcrumbs>
        </Header.LeftItem>

        <Header.RightItem className="items-center">
          {!isLocked && (
            <GlobalViewLayoutSelection
              onChange={handleLayoutChange}
              selectedLayout={activeLayout ?? EIssueLayoutTypes.SPREADSHEET}
              workspaceSlug={workspaceSlug.toString()}
            />
          )}
          {globalViewId && <WorkItemFiltersToggle entityType={EIssuesStoreType.GLOBAL} entityId={globalViewId} />}
          {!isLocked && (
            <FiltersDropdown title={t("common.display")} placement="bottom-end">
              <DisplayFiltersSelection
                layoutDisplayFiltersOptions={currentLayoutFilters}
                displayFilters={issueFilters?.displayFilters ?? {}}
                handleDisplayFiltersUpdate={handleDisplayFilters}
                displayProperties={issueFilters?.displayProperties ?? {}}
                handleDisplayPropertiesUpdate={handleDisplayProperties}
              />
            </FiltersDropdown>
          )}
          <Button
            variant="primary"
            size="lg"
            data-ph-element={GLOBAL_VIEW_TRACKER_ELEMENTS.RIGHT_HEADER_ADD_BUTTON}
            onClick={() => setCreateViewModal(true)}
          >
            {t("workspace_views.add_view")}
          </Button>
          <div className="hidden md:block">
            {viewDetails && <WorkspaceViewQuickActions workspaceSlug={workspaceSlug?.toString()} view={viewDetails} />}
            {isDefaultView && defaultViewDetails && (
              <DefaultWorkspaceViewQuickActions workspaceSlug={workspaceSlug?.toString()} view={defaultViewDetails} />
            )}
          </div>
        </Header.RightItem>
      </Header>
    </>
  );
});
