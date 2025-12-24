import type { FC } from "react";
import { observer } from "mobx-react";
import { useTheme } from "next-themes";
// plane imports
import { PROGRESS_STATE_GROUPS_DETAILS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import type { TWorkItemFilterCondition } from "@plane/shared-state";
import type { ICycle } from "@plane/types";
import { LinearProgressIndicator, Loader } from "@plane/ui";
// assets
import darkProgressAsset from "@/app/assets/empty-state/active-cycle/progress-dark.webp?url";
import lightProgressAsset from "@/app/assets/empty-state/active-cycle/progress-light.webp?url";
// components
import { SimpleEmptyState } from "@/components/empty-state/simple-empty-state-root";

export type ActiveCycleProgressProps = {
  cycle: ICycle | null;
  workspaceSlug: string;
  projectId: string;
  handleFiltersUpdate: (conditions: TWorkItemFilterCondition[]) => void;
};

export const ActiveCycleProgress = observer(function ActiveCycleProgress(props: ActiveCycleProgressProps) {
  const { handleFiltersUpdate, cycle } = props;
  // theme hook
  const { resolvedTheme } = useTheme();
  // plane hooks
  const { t } = useTranslation();
  // derived values
  const progressIndicatorData = PROGRESS_STATE_GROUPS_DETAILS.map((group, index) => ({
    id: index,
    name: group.title,
    value: cycle && cycle.total_issues > 0 ? (cycle[group.key as keyof ICycle] as number) : 0,
    color: group.color,
  }));
  const groupedIssues: any = cycle
    ? {
        completed: cycle?.completed_issues,
        started: cycle?.started_issues,
        unstarted: cycle?.unstarted_issues,
        backlog: cycle?.backlog_issues,
      }
    : {};
  const resolvedPath = resolvedTheme === "light" ? lightProgressAsset : darkProgressAsset;

  return cycle && cycle.hasOwnProperty("started_issues") ? (
    <div className="flex flex-col min-h-[17rem] gap-5 py-4 px-3.5 bg-surface-1 border border-subtle rounded-lg">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-14 text-tertiary font-semibold">{t("project_cycles.active_cycle.progress")}</h3>
          {cycle.total_issues > 0 && (
            <span className="flex gap-1 text-13 text-placeholder font-medium whitespace-nowrap rounded-xs px-3 py-1 ">
              {`${cycle.completed_issues + cycle.cancelled_issues}/${cycle.total_issues - cycle.cancelled_issues} ${
                cycle.completed_issues + cycle.cancelled_issues > 1 ? "Work items" : "Work item"
              } closed`}
            </span>
          )}
        </div>
        {cycle.total_issues > 0 && <LinearProgressIndicator size="lg" data={progressIndicatorData} />}
      </div>

      {cycle.total_issues > 0 ? (
        <div className="flex flex-col gap-5">
          {Object.keys(groupedIssues).map((group, index) => (
            <>
              {groupedIssues[group] > 0 && (
                <div key={index}>
                  <div
                    className="flex items-center justify-between gap-2 text-13 cursor-pointer"
                    onClick={() => {
                      handleFiltersUpdate([{ property: "state_group", operator: "in", value: [group] }]);
                    }}
                  >
                    <div className="flex items-center gap-1.5">
                      <span
                        className="block h-3 w-3 rounded-full"
                        style={{
                          backgroundColor: PROGRESS_STATE_GROUPS_DETAILS[index].color,
                        }}
                      />
                      <span className="text-tertiary capitalize font-medium w-16">{group}</span>
                    </div>
                    <span className="text-tertiary">{`${groupedIssues[group]} ${
                      groupedIssues[group] > 1 ? "Work items" : "Work item"
                    }`}</span>
                  </div>
                </div>
              )}
            </>
          ))}
          {cycle.cancelled_issues > 0 && (
            <span className="flex items-center gap-2 text-13 text-tertiary">
              <span>
                {`${cycle.cancelled_issues} cancelled ${
                  cycle.cancelled_issues > 1 ? "work items are" : "work item is"
                } excluded from this report.`}{" "}
              </span>
            </span>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center h-full w-full">
          <SimpleEmptyState title={t("active_cycle.empty_state.progress.title")} assetPath={resolvedPath} />
        </div>
      )}
    </div>
  ) : (
    <Loader className="flex flex-col min-h-[17rem] gap-5 bg-surface-1 border border-subtle rounded-lg">
      <Loader.Item width="100%" height="100%" />
    </Loader>
  );
});
