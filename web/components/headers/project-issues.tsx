import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import { ArrowLeft, Circle, ExternalLink, Plus } from "lucide-react";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { DisplayFiltersSelection, FiltersDropdown, FilterSelection, LayoutSelection } from "components/issues";
import { ProjectAnalyticsModal } from "components/analytics";
// ui
import { Breadcrumbs, BreadcrumbItem, Button } from "@plane/ui";
// types
import { IIssueDisplayFilterOptions, IIssueDisplayProperties, IIssueFilterOptions, TIssueLayouts } from "types";
// constants
import { ISSUE_DISPLAY_FILTERS_BY_LAYOUT } from "constants/issue";
// helper
import { truncateText } from "helpers/string.helper";

export const ProjectIssuesHeader: React.FC = observer(() => {
  const [analyticsModal, setAnalyticsModal] = useState(false);

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { issueFilter: issueFilterStore, project: projectStore, inbox: inboxStore } = useMobxStore();

  const activeLayout = issueFilterStore.userDisplayFilters.layout;

  const handleLayoutChange = useCallback(
    (layout: TIssueLayouts) => {
      if (!workspaceSlug || !projectId) return;

      issueFilterStore.updateUserFilters(workspaceSlug.toString(), projectId.toString(), {
        display_filters: {
          layout,
        },
      });
    },
    [issueFilterStore, projectId, workspaceSlug]
  );

  const handleFiltersUpdate = useCallback(
    (key: keyof IIssueFilterOptions, value: string | string[]) => {
      if (!workspaceSlug || !projectId) return;

      const newValues = issueFilterStore.userFilters?.[key] ?? [];

      if (Array.isArray(value)) {
        value.forEach((val) => {
          if (!newValues.includes(val)) newValues.push(val);
        });
      } else {
        if (issueFilterStore.userFilters?.[key]?.includes(value)) newValues.splice(newValues.indexOf(value), 1);
        else newValues.push(value);
      }

      issueFilterStore.updateUserFilters(workspaceSlug.toString(), projectId.toString(), {
        filters: {
          [key]: newValues,
        },
      });
    },
    [issueFilterStore, projectId, workspaceSlug]
  );

  const handleDisplayFiltersUpdate = useCallback(
    (updatedDisplayFilter: Partial<IIssueDisplayFilterOptions>) => {
      if (!workspaceSlug || !projectId) return;

      issueFilterStore.updateUserFilters(workspaceSlug.toString(), projectId.toString(), {
        display_filters: {
          ...updatedDisplayFilter,
        },
      });
    },
    [issueFilterStore, projectId, workspaceSlug]
  );

  const handleDisplayPropertiesUpdate = useCallback(
    (property: Partial<IIssueDisplayProperties>) => {
      if (!workspaceSlug || !projectId) return;

      issueFilterStore.updateDisplayProperties(workspaceSlug.toString(), projectId.toString(), property);
    },
    [issueFilterStore, projectId, workspaceSlug]
  );

  const projectDetails =
    workspaceSlug && projectId
      ? projectStore.getProjectById(workspaceSlug.toString(), projectId.toString())
      : undefined;

  const inboxDetails = projectId ? inboxStore.inboxesList?.[projectId.toString()]?.[0] : undefined;

  const deployUrl = process.env.NEXT_PUBLIC_DEPLOY_URL;

  return (
    <>
      <ProjectAnalyticsModal
        isOpen={analyticsModal}
        onClose={() => setAnalyticsModal(false)}
        projectDetails={projectDetails ?? undefined}
      />
      <div className="relative flex w-full flex-shrink-0 flex-row z-10 items-center justify-between gap-x-2 gap-y-4 border-b border-custom-border-200 bg-custom-sidebar-background-100 p-4">
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
            <Breadcrumbs onBack={() => router.back()}>
              <BreadcrumbItem
                link={
                  <Link href={`/${workspaceSlug}/projects`}>
                    <a className={`border-r-2 border-custom-sidebar-border-200 px-3 text-sm `}>
                      <p>Projects</p>
                    </a>
                  </Link>
                }
              />
              <BreadcrumbItem title={`${truncateText(projectDetails?.name ?? "Project", 32)} Issues`} />
            </Breadcrumbs>
          </div>
          {projectDetails?.is_deployed && deployUrl && (
            <a
              href={`${deployUrl}/${workspaceSlug}/${projectDetails?.id}`}
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
              filters={issueFilterStore.userFilters}
              handleFiltersUpdate={handleFiltersUpdate}
              layoutDisplayFiltersOptions={
                activeLayout ? ISSUE_DISPLAY_FILTERS_BY_LAYOUT.issues[activeLayout] : undefined
              }
              labels={projectStore.labels?.[projectId?.toString() ?? ""] ?? undefined}
              members={projectStore.members?.[projectId?.toString() ?? ""]?.map((m) => m.member)}
              states={projectStore.states?.[projectId?.toString() ?? ""] ?? undefined}
            />
          </FiltersDropdown>
          <FiltersDropdown title="Display" placement="bottom-end">
            <DisplayFiltersSelection
              displayFilters={issueFilterStore.userDisplayFilters}
              displayProperties={issueFilterStore.userDisplayProperties}
              handleDisplayFiltersUpdate={handleDisplayFiltersUpdate}
              handleDisplayPropertiesUpdate={handleDisplayPropertiesUpdate}
              layoutDisplayFiltersOptions={
                activeLayout ? ISSUE_DISPLAY_FILTERS_BY_LAYOUT.issues[activeLayout] : undefined
              }
            />
          </FiltersDropdown>
          {projectId && inboxStore.isInboxEnabled && inboxDetails && (
            <Link href={`/${workspaceSlug}/projects/${projectId}/inbox/${inboxStore.getInboxId(projectId.toString())}`}>
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
              const e = new KeyboardEvent("keydown", {
                key: "c",
              });
              document.dispatchEvent(e);
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
