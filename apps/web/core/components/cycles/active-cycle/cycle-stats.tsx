"use client";

import type { FC } from "react";
import { Fragment, useCallback, useRef, useState, useEffect } from "react";
import { isEmpty } from "lodash-es";
import { observer } from "mobx-react";
import { useRouter } from "next/navigation";
import { CalendarCheck } from "lucide-react";
// headless ui
import { Tab } from "@headlessui/react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { PriorityIcon } from "@plane/propel/icons";
import type { TWorkItemFilterCondition } from "@plane/shared-state";
import type { ICycle } from "@plane/types";
import { EIssuesStoreType } from "@plane/types";
// ui
import { Loader, Avatar } from "@plane/ui";
import { cn, renderFormattedDate, renderFormattedDateWithoutYear, getFileURL } from "@plane/utils";
// antd
import { Tag, Tooltip } from "antd";
// components
import { SingleProgressStats } from "@/components/core/sidebar/single-progress-stats";
import { StateDropdown } from "@/components/dropdowns/state/dropdown";
import { SimpleEmptyState } from "@/components/empty-state/simple-empty-state-root";
// helpers
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useIssues } from "@/hooks/store/use-issues";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import useLocalStorage from "@/hooks/use-local-storage";
// plane web components
import { useResolvedAssetPath } from "@/hooks/use-resolved-asset-path";
import { IssueIdentifier } from "@/plane-web/components/issues/issue-details/issue-identifier";
// services
// store
import type { ActiveCycleIssueDetails } from "@/store/issue/cycle";
// types

export type ActiveCycleStatsProps = {
  workspaceSlug: string;
  projectId: string;
  cycle: ICycle | null;
  cycleId?: string | null;
  handleFiltersUpdate: (conditions: TWorkItemFilterCondition[]) => void;
  cycleIssueDetails: ActiveCycleIssueDetails;
};

export const ActiveCycleStats: FC<ActiveCycleStatsProps> = observer((props) => {
  const { workspaceSlug, projectId, cycle, cycleId, handleFiltersUpdate, cycleIssueDetails } = props;
  const router = useRouter();
  // local storage
  const { storedValue: tab, setValue: setTab } = useLocalStorage("activeCycleTab", "Assignees");
  // refs
  const issuesContainerRef = useRef<HTMLDivElement | null>(null);
  // states
  const [issuesLoaderElement, setIssueLoaderElement] = useState<HTMLDivElement | null>(null);
  const [testPlans, setTestPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  // plane hooks
  const { t } = useTranslation();
  // derived values
  const priorityResolvedPath = useResolvedAssetPath({ basePath: "/empty-state/active-cycle/priority" });
  const assigneesResolvedPath = useResolvedAssetPath({ basePath: "/empty-state/active-cycle/assignee" });
  const labelsResolvedPath = useResolvedAssetPath({ basePath: "/empty-state/active-cycle/label" });

  const currentValue = (tab: string | null) => {
    switch (tab) {
      case "Priority-Issues":
        return 0;
      case "Assignees":
        return 1;
      case "Labels":
        return 2;
      default:
        return 0;
    }
  };
  const {
    issues: { fetchNextActiveCycleIssues },
  } = useIssues(EIssuesStoreType.CYCLE);
  const {
    issue: { getIssueById },
    setPeekIssue,
  } = useIssueDetail();
  const loadMoreIssues = useCallback(() => {
    if (!cycleId) return;
    fetchNextActiveCycleIssues(workspaceSlug, projectId, cycleId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceSlug, projectId, cycleId, issuesLoaderElement, cycleIssueDetails?.nextPageResults]);

  useIntersectionObserver(issuesContainerRef, issuesLoaderElement, loadMoreIssues, `0% 0% 100% 0%`);

  // 渲染测试计划状态
  const renderState = (state: any) => {
    const colorMap: Record<string, string> = {
      未开始: "default",
      进行中: "processing",
      已完成: "success",
    };
    const color = colorMap[state] || "default";
    const text = state ? state.toString() : "-";
    return <Tag color={color}>{text}</Tag>;
  };

  // 渲染通过率
  const renderPassRate = (passRate: any) => {
    if (!passRate) return "-";

    const orderKeys = ["成功", "失败", "阻塞", "未执行"];
    const totalCount = orderKeys.reduce((s, k) => s + Number(passRate?.[k] || 0), 0);
    const passed = Number(passRate?.["成功"] || 0);
    const percent = totalCount > 0 ? Math.floor((passed / totalCount) * 100) : 0;

    const colorHexMap: Record<string, string> = {
      green: "#52c41a",
      red: "#ff4d4f",
      gold: "#faad14",
      blue: "#1677ff",
      gray: "#bfbfbf",
      default: "#d9d9d9",
    };

    const categoryColor: Record<string, string> = {
      成功: colorHexMap.green,
      失败: colorHexMap.red,
      阻塞: colorHexMap.gold,
      未执行: colorHexMap.gray,
    };

    const segments = orderKeys.map((k) => {
      const count = Number(passRate?.[k] || 0);
      const color = categoryColor[k] || colorHexMap.default;
      const widthPct = totalCount > 0 ? (count / totalCount) * 100 : 0;
      return { key: k, count, color, widthPct };
    });

    const tooltipContent = (
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {orderKeys.map((k) => (
          <div key={k} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "2px",
                backgroundColor: categoryColor[k] || colorHexMap.default,
                display: "inline-block",
              }}
            />
            <span style={{ fontSize: "12px", color: "var(--color-text, #333)" }}>{k}</span>
            <span style={{ marginLeft: "auto", fontSize: "12px", color: "#8c8c8c" }}>{Number(passRate?.[k] || 0)}</span>
          </div>
        ))}
      </div>
    );

    return (
      <Tooltip mouseEnterDelay={0.25} title={tooltipContent} color="#fff" overlayInnerStyle={{ color: "#333" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: "80px" }}>
          <div style={{ flex: "1", minWidth: "50px" }}>
            <div
              style={{
                width: "100%",
                height: "5px",
                border: "1px solid #e8e8e8",
                borderRadius: "5px",
                overflow: "hidden",
                display: "flex",
              }}
            >
              {segments.map((seg, idx) => (
                <div
                  key={`${seg.key}-${idx}`}
                  style={{ width: `${seg.widthPct}%`, backgroundColor: seg.color, height: "100%" }}
                />
              ))}
            </div>
          </div>
          <span style={{ fontSize: "11px", color: "var(--color-text, #333)", minWidth: "25px" }}>{percent}%</span>
        </div>
      </Tooltip>
    );
  };

  // 从 cycle 数据中获取测试计划
  useEffect(() => {
    if (cycle && cycle.plans) {
      setTestPlans(cycle.plans);
      setLoading(false);
    } else {
      setTestPlans([]);
      setLoading(false);
    }
  }, [cycle]);

  const loaders = (
    <Loader className="space-y-3">
      <Loader.Item height="30px" />
      <Loader.Item height="30px" />
      <Loader.Item height="30px" />
    </Loader>
  );

  return cycleId ? (
    <div className="flex flex-col gap-4 p-4 min-h-[17rem] overflow-hidden bg-custom-background-100 col-span-1 lg:col-span-2 xl:col-span-1 border border-custom-border-200 rounded-lg">
      <Tab.Group
        as={Fragment}
        defaultIndex={currentValue(tab)}
        onChange={(i) => {
          switch (i) {
            case 0:
              return setTab("Priority-Issues");
            case 1:
              return setTab("Assignees");
            case 2:
              return setTab("Labels");

            default:
              return setTab("Priority-Issues");
          }
        }}
      >
        <Tab.List
          as="div"
          className="relative border-[0.5px] border-custom-border-200 rounded bg-custom-background-80 p-[1px] grid"
          style={{
            gridTemplateColumns: `repeat(3, 1fr)`,
          }}
        >
          <Tab
            className={({ selected }) =>
              cn(
                "relative z-[1] font-semibold text-xs rounded-[3px] py-1.5 text-custom-text-400 focus:outline-none transition duration-500",
                {
                  "text-custom-text-300 bg-custom-background-100": selected,
                  "hover:text-custom-text-300": !selected,
                }
              )
            }
          >
            {/* {t("project_cycles.active_cycle.priority_issue")} */}
            测试计划
          </Tab>
          <Tab
            className={({ selected }) =>
              cn(
                "relative z-[1] font-semibold text-xs rounded-[3px] py-1.5 text-custom-text-400 focus:outline-none transition duration-500",
                {
                  "text-custom-text-300 bg-custom-background-100": selected,
                  "hover:text-custom-text-300": !selected,
                }
              )
            }
          >
            {t("project_cycles.active_cycle.assignees")}
          </Tab>
          <Tab
            className={({ selected }) =>
              cn(
                "relative z-[1] font-semibold text-xs rounded-[3px] py-1.5 text-custom-text-400 focus:outline-none transition duration-500",
                {
                  "text-custom-text-300 bg-custom-background-100": selected,
                  "hover:text-custom-text-300": !selected,
                }
              )
            }
          >
            {t("project_cycles.active_cycle.labels")}
          </Tab>
        </Tab.List>

        <Tab.Panels as={Fragment}>
          <Tab.Panel as="div" className="flex h-52 w-full flex-col overflow-hidden text-custom-text-200">
            {loading ? (
              <div className="h-full w-full p-4 overflow-y-auto vertical-scrollbar scrollbar-sm">{loaders}</div>
            ) : error ? (
              <div className="flex items-center justify-center h-full w-full">
                <div className="text-sm text-custom-text-300">{error}</div>
              </div>
            ) : testPlans.length > 0 ? (
              <div className="flex flex-col h-full w-full">
                {/* 表格头部 */}
                <div className="grid grid-cols-4 gap-2 px-2 py-1 text-xs font-medium text-custom-text-400 border-b border-custom-border-200 shrink-0 bg-custom-background-100">
                  <div>测试计划名称</div>
                  <div>用例库名称</div>
                  <div>状态</div>
                  <div>通过率</div>
                </div>

                {/* 表格内容 */}
                <div
                  ref={issuesContainerRef}
                  className="flex-1 overflow-y-auto vertical-scrollbar scrollbar-sm divide-y divide-custom-border-200"
                >
                  {testPlans.map((plan) => (
                    <div
                      key={plan.id}
                      className="grid grid-cols-4 gap-2 px-2 py-2 text-sm hover:bg-custom-background-90 cursor-pointer"
                      onClick={() => {
                        const planId = plan?.id;
                        const repo = plan?.repository;
                        const repositoryId = typeof repo === "string" ? repo : repo?.id;
                        if (!planId || !repositoryId) return;
                        router.push(
                          `/${workspaceSlug}/projects/${projectId}/test-management/plan-cases/?planId=${planId}&repositoryId=${repositoryId}`
                        );
                      }}
                    >
                      <div className="truncate text-custom-text-100" title={plan.name}>
                        {plan.name}
                      </div>
                      <div
                        className="truncate text-custom-text-300"
                        title={(plan.repository?.name ?? plan.repository_name) || "未知"}
                      >
                        {(plan.repository?.name ?? plan.repository_name) || "未知"}
                      </div>
                      <div className="flex items-center">{renderState(plan.state)}</div>
                      <div className="flex items-center">{renderPassRate(plan.pass_rate)}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full w-full">
                <SimpleEmptyState title="暂无关联测试计划" assetPath={priorityResolvedPath} />
              </div>
            )}
          </Tab.Panel>

          <Tab.Panel
            as="div"
            className="flex h-52 w-full flex-col gap-1 overflow-y-auto text-custom-text-200 vertical-scrollbar scrollbar-sm"
          >
            {cycle && !isEmpty(cycle.distribution) ? (
              cycle?.distribution?.assignees && cycle.distribution.assignees.length > 0 ? (
                cycle.distribution?.assignees?.map((assignee, index) => {
                  if (assignee.assignee_id)
                    return (
                      <SingleProgressStats
                        key={assignee.assignee_id}
                        title={
                          <div className="flex items-center gap-2">
                            <Avatar
                              name={assignee?.display_name ?? undefined}
                              src={getFileURL(assignee?.avatar_url ?? "")}
                            />

                            <span>{assignee.display_name}</span>
                          </div>
                        }
                        completed={assignee.completed_issues}
                        total={assignee.total_issues}
                        onClick={() => {
                          if (assignee.assignee_id) {
                            handleFiltersUpdate([
                              { property: "assignee_id", operator: "in", value: [assignee.assignee_id] },
                            ]);
                          }
                        }}
                      />
                    );
                  else
                    return (
                      <SingleProgressStats
                        key={`unassigned-${index}`}
                        title={
                          <div className="flex items-center gap-2">
                            <div className="h-5 w-5 rounded-full border-2 border-custom-border-200 bg-custom-background-80">
                              <img src="/user.png" height="100%" width="100%" className="rounded-full" alt="User" />
                            </div>
                            <span>{t("no_assignee")}</span>
                          </div>
                        }
                        completed={assignee.completed_issues}
                        total={assignee.total_issues}
                      />
                    );
                })
              ) : (
                <div className="flex items-center justify-center h-full w-full">
                  <SimpleEmptyState
                    title={t("active_cycle.empty_state.assignee.title")}
                    assetPath={assigneesResolvedPath}
                  />
                </div>
              )
            ) : (
              loaders
            )}
          </Tab.Panel>

          <Tab.Panel
            as="div"
            className="flex h-52 w-full flex-col gap-1 overflow-y-auto  text-custom-text-200 vertical-scrollbar scrollbar-sm"
          >
            {cycle && !isEmpty(cycle.distribution) ? (
              cycle?.distribution?.labels && cycle.distribution.labels.length > 0 ? (
                cycle.distribution.labels?.map((label, index) => (
                  <SingleProgressStats
                    key={label.label_id ?? `no-label-${index}`}
                    title={
                      <div className="flex items-center gap-2 truncate">
                        <span
                          className="block h-3 w-3 rounded-full flex-shrink-0"
                          style={{
                            backgroundColor: label.color ?? "#000000",
                          }}
                        />
                        <span className="text-xs text-ellipsis truncate">{label.label_name ?? "No labels"}</span>
                      </div>
                    }
                    completed={label.completed_issues}
                    total={label.total_issues}
                    onClick={
                      label.label_id
                        ? () => {
                            if (label.label_id) {
                              handleFiltersUpdate([{ property: "label_id", operator: "in", value: [label.label_id] }]);
                            }
                          }
                        : undefined
                    }
                  />
                ))
              ) : (
                <div className="flex items-center justify-center h-full w-full">
                  <SimpleEmptyState title={t("active_cycle.empty_state.label.title")} assetPath={labelsResolvedPath} />
                </div>
              )
            ) : (
              loaders
            )}
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  ) : (
    <Loader className="flex flex-col gap-4 min-h-[17rem] overflow-hidden bg-custom-background-100 col-span-1 lg:col-span-2 xl:col-span-1">
      <Loader.Item width="100%" height="17rem" />
    </Loader>
  );
});
