import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import { ArrowLeft, Briefcase, Circle, ExternalLink, Plus } from "lucide-react";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { DisplayFiltersSelection, FiltersDropdown, FilterSelection, LayoutSelection } from "components/issues";
import { ProjectAnalyticsModal } from "components/analytics";
// ui
import { Breadcrumbs, Button, LayersIcon } from "@plane/ui";
// types
import { IIssueDisplayFilterOptions, IIssueDisplayProperties, IIssueFilterOptions, TIssueLayouts } from "types";
// constants
import { ISSUE_DISPLAY_FILTERS_BY_LAYOUT } from "constants/issue";
// helper
import { renderEmoji } from "helpers/emoji.helper";
import { EFilterType } from "store/issues/types";
import { EProjectStore } from "store/command-palette.store";

export const ProjectIssuesHeader: React.FC = observer(() => {
  const [analyticsModal, setAnalyticsModal] = useState(false);

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query as { workspaceSlug: string; projectId: string };

  const {
    project: { currentProjectDetails },
    projectLabel: { projectLabels },
    projectMember: { projectMembers },
    projectState: projectStateStore,
    inbox: inboxStore,
    commandPalette: commandPaletteStore,
    trackEvent: { setTrackElement },
    // issue filters
    projectIssuesFilter: { issueFilters, updateFilters },
    projectIssues: {},
  } = useMobxStore();

  const activeLayout = issueFilters?.displayFilters?.layout;

  const handleFiltersUpdate = useCallback(
    (key: keyof IIssueFilterOptions, value: string | string[]) => {
      if (!workspaceSlug || !projectId) return;
      const newValues = issueFilters?.filters?.[key] ?? [];

      if (Array.isArray(value)) {
        value.forEach((val) => {
          if (!newValues.includes(val)) newValues.push(val);
        });
      } else {
        if (issueFilters?.filters?.[key]?.includes(value)) newValues.splice(newValues.indexOf(value), 1);
        else newValues.push(value);
      }

      updateFilters(workspaceSlug, projectId, EFilterType.FILTERS, { [key]: newValues });
    },
    [workspaceSlug, projectId, issueFilters, updateFilters]
  );

  const handleLayoutChange = useCallback(
    (layout: TIssueLayouts) => {
      if (!workspaceSlug || !projectId) return;
      updateFilters(workspaceSlug, projectId, EFilterType.DISPLAY_FILTERS, { layout: layout });
    },
    [workspaceSlug, projectId, updateFilters]
  );

  const handleDisplayFilters = useCallback(
    (updatedDisplayFilter: Partial<IIssueDisplayFilterOptions>) => {
      if (!workspaceSlug || !projectId) return;
      updateFilters(workspaceSlug, projectId, EFilterType.DISPLAY_FILTERS, updatedDisplayFilter);
    },
    [workspaceSlug, projectId, updateFilters]
  );

  const handleDisplayProperties = useCallback(
    (property: Partial<IIssueDisplayProperties>) => {
      if (!workspaceSlug || !projectId) return;
      updateFilters(workspaceSlug, projectId, EFilterType.DISPLAY_PROPERTIES, property);
    },
    [workspaceSlug, projectId, updateFilters]
  );

  const inboxDetails = projectId ? inboxStore.inboxesList?.[projectId]?.[0] : undefined;

  const deployUrl = process.env.NEXT_PUBLIC_DEPLOY_URL;

  return (
    <>
      <ProjectAnalyticsModal
        isOpen={analyticsModal}
        onClose={() => setAnalyticsModal(false)}
        projectDetails={currentProjectDetails ?? undefined}
      />
      <div className="relative flex w-full flex-shrink-0 flex-row z-10 h-[3.75rem] items-center justify-between gap-x-2 gap-y-4 border-b border-custom-border-200 bg-custom-sidebar-background-100 p-4">
        <div className="flex items-center gap-2 flex-grow w-full whitespace-nowrap overflow-ellipsis">
          <div className="block md:hidden">
            <button
              type="button"
              className="grid h-8 w-8 place-items-center rounded border border-custom-border-200"
              onClick={() => router.back()}
            >
              <ArrowLeft fontSize={14} strokeWidth={2} />
            </button>
          </div>
          <div>
            <Breadcrumbs>
              <Breadcrumbs.BreadcrumbItem
                type="text"
                icon={
                  currentProjectDetails ? (
                    currentProjectDetails?.emoji ? (
                      <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded uppercase">
                        {renderEmoji(currentProjectDetails.emoji)}
                      </span>
                    ) : currentProjectDetails?.icon_prop ? (
                      <div className="h-7 w-7 flex-shrink-0 grid place-items-center">
                        {renderEmoji(currentProjectDetails.icon_prop)}
                      </div>
                    ) : (
                      <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded bg-gray-700 uppercase text-white">
                        {currentProjectDetails?.name.charAt(0)}
                      </span>
                    )
                  ) : (
                    <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded uppercase">
                      <Briefcase className="h-4 w-4" />
                    </span>
                  )
                }
                label={currentProjectDetails?.name ?? "Project"}
                link={`/${workspaceSlug}/projects`}
              />

              <Breadcrumbs.BreadcrumbItem
                type="text"
                icon={<LayersIcon className="h-4 w-4 text-custom-text-300" />}
                label="Issues"
              />
            </Breadcrumbs>
          </div>
          {currentProjectDetails?.is_deployed && deployUrl && (
            <a
              href={`${deployUrl}/${workspaceSlug}/${currentProjectDetails?.id}`}
              className="group bg-custom-primary-100/10 text-custom-primary-100 px-2.5 py-1 text-xs flex items-center gap-1.5 rounded font-medium"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Circle className="h-1.5 w-1.5 fill-custom-primary-100" strokeWidth={2} />
              Public
              <ExternalLink className="h-3 w-3 hidden group-hover:block" strokeWidth={2} />
            </a>
          )}
        </div>
        <div className="flex items-center gap-2">
          <LayoutSelection
            layouts={["list", "kanban", "calendar", "spreadsheet", "gantt_chart"]}
            onChange={(layout) => handleLayoutChange(layout)}
            selectedLayout={activeLayout}
          />
          <FiltersDropdown title="Filters" placement="bottom-end">
            <FilterSelection
              filters={issueFilters?.filters ?? {}}
              handleFiltersUpdate={handleFiltersUpdate}
              layoutDisplayFiltersOptions={
                activeLayout ? ISSUE_DISPLAY_FILTERS_BY_LAYOUT.issues[activeLayout] : undefined
              }
              labels={projectLabels ?? undefined}
              members={projectMembers?.map((m) => m.member)}
              states={projectStateStore.states?.[projectId ?? ""] ?? undefined}
            />
          </FiltersDropdown>
          <FiltersDropdown title="Display" placement="bottom-end">
            <DisplayFiltersSelection
              layoutDisplayFiltersOptions={
                activeLayout ? ISSUE_DISPLAY_FILTERS_BY_LAYOUT.issues[activeLayout] : undefined
              }
              displayFilters={issueFilters?.displayFilters ?? {}}
              handleDisplayFiltersUpdate={handleDisplayFilters}
              displayProperties={issueFilters?.displayProperties ?? {}}
              handleDisplayPropertiesUpdate={handleDisplayProperties}
            />
          </FiltersDropdown>
          {projectId && inboxStore.isInboxEnabled && inboxDetails && (
            <Link href={`/${workspaceSlug}/projects/${projectId}/inbox/${inboxStore.getInboxId(projectId)}`}>
              <a>
                <Button variant="neutral-primary" size="sm" className="relative">
                  Inbox
                  {inboxDetails.pending_issue_count > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full text-custom-text-100 bg-custom-sidebar-background-80 border border-custom-sidebar-border-200">
                      {inboxDetails.pending_issue_count}
                    </span>
                  )}
                </Button>
              </a>
            </Link>
          )}
          <Button onClick={() => setAnalyticsModal(true)} variant="neutral-primary" size="sm">
            Analytics
          </Button>
          <Button
            onClick={() => {
              setTrackElement("PROJECT_PAGE_HEADER");
              commandPaletteStore.toggleCreateIssueModal(true, EProjectStore.PROJECT);
            }}
            size="sm"
            prependIcon={<Plus />}
          >
            Add Issue
          </Button>
        </div>
      </div>
    </>
  );
});
