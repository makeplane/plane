/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { createElement, useEffect, useRef, useState } from "react";
import type { TIssue, TIssuesResponse } from "@plane/types";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { useProject } from "@/hooks/store/use-project";
import { extractExternalLinks } from "@/components/gantt-chart/dependencies/external-links";
import type { TExternalLink } from "@/components/gantt-chart/dependencies/external-links";
import { peerLinksFromDependencies } from "@/components/gantt-chart/dependencies/external-links";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import type { TDependencyType, TGanttDependency } from "@/components/gantt-chart/dependencies/dependency-utils";
import {
  dependencyValidationMessages,
  extractGanttRelations,
  validateNewDependency,
} from "@/components/gantt-chart/dependencies/dependency-utils";
import { scheduleService } from "@/components/bih-schedule/schedule-service";
import { IssueService } from "@/services/issue";

const issueService = new IssueService();

type GanttRelations = ReturnType<typeof extractGanttRelations> & {
  externalLinks: TExternalLink[];
  lagsSupported: boolean;
  issueDates: Record<string, Pick<TIssue, "start_date" | "target_date" | "name" | "sequence_id">>;
};

export function useGanttDependencies(
  workspaceSlug: string | undefined,
  projectId: string | undefined,
  enabled: boolean
) {
  const { relation } = useIssueDetail();
  const { getProjectById } = useProject();
  const [relations, setRelations] = useState<GanttRelations>();
  const relationsRef = useRef(relations);
  const generation = useRef(0);
  const saving = useRef(false);
  const projectIssueIds = useRef(new Set<string>());
  const updateRelations = (next: GanttRelations | undefined) => {
    relationsRef.current = next;
    setRelations(next);
  };
  const requestCounter = useRef(0);
  const refreshRef = useRef<() => Promise<void>>(async () => {});

  useEffect(() => {
    generation.current++;
    refreshRef.current = async () => {};
    saving.current = false;
    projectIssueIds.current.clear();
    updateRelations(undefined);
    if (!enabled || !workspaceSlug || !projectId) return;
    const invalidateRequests = () => {
      requestCounter.current++;
      generation.current++;
    };

    const fetchDependencies = async () => {
      if (saving.current) return;
      const request = ++requestCounter.current;
      try {
        const issues: TIssue[] = [];
        // shortcut: fetch at most 10,000 work items, raise the cap if larger projects need complete arrows.
        for (let page = 0; page < 10; page++) {
          // oxlint-disable-next-line no-await-in-loop -- Each response decides whether another page exists.
          const response: TIssuesResponse | TIssue[] = await issueService.getIssuesFromServer(
            workspaceSlug,
            projectId,
            {
              expand: "issue_relation,issue_related",
              per_page: 1000,
              cursor: `1000:${page}:0`,
            }
          );
          if (request !== requestCounter.current) return;
          const results = Array.isArray(response) ? response : response.results;
          if (!Array.isArray(results)) throw new Error("Expected ungrouped Gantt dependency results");
          issues.push(...results);
          if (Array.isArray(response) || !response.next_page_results) break;
        }
        const lags = await scheduleService.getLags(workspaceSlug, projectId).catch(() => null);
        const externalLinks = extractExternalLinks(issues, projectId);
        // Lags of cross-project dependencies come from the workspace endpoint; skip it when there are none.
        const externalLags = externalLinks.length
          ? await scheduleService.getWorkspaceLags(workspaceSlug).catch(() => [])
          : [];
        const externalLagMap = new Map(externalLags.map((lag) => [`${lag.predecessor}|${lag.successor}`, lag]));
        if (request === requestCounter.current) {
          const extracted = extractGanttRelations(issues, projectId);
          const lagMap = new Map(lags?.map((lag) => [`${lag.predecessor}|${lag.successor}`, lag]));
          projectIssueIds.current = new Set(issues.map((issue) => issue.id));
          updateRelations({
            ...extracted,
            externalLinks: externalLinks.map((link) => {
              const saved = externalLagMap.get(
                link.direction === "pred" ? `${link.externalId}|${link.localId}` : `${link.localId}|${link.externalId}`
              );
              return { ...link, lagDays: saved?.lag_days ?? 0, depType: saved?.dep_type ?? "FS" };
            }),
            lagsSupported: lags !== null,
            dependencies: extracted.dependencies.map((dep) => {
              const saved = lagMap.get(`${dep.predecessorId}|${dep.successorId}`);
              return {
                predecessorId: dep.predecessorId,
                successorId: dep.successorId,
                lagDays: saved?.lag_days ?? 0,
                depType: saved?.dep_type ?? "FS",
              };
            }),
            issueDates: Object.fromEntries(
              issues.map(({ id, start_date, target_date, name, sequence_id }) => [
                id,
                { start_date, target_date, name, sequence_id },
              ])
            ),
          });
        }
      } catch (error) {
        if (request === requestCounter.current) console.error("Failed to fetch Gantt dependencies", error);
      }
    };

    refreshRef.current = fetchDependencies;
    void fetchDependencies();
    window.addEventListener("focus", fetchDependencies);
    return () => {
      invalidateRequests();
      refreshRef.current = async () => {};
      window.removeEventListener("focus", fetchDependencies);
    };
  }, [workspaceSlug, projectId, enabled]);

  const mutateDependency = async (predecessorId: string, successorId: string, remove: boolean) => {
    const current = relationsRef.current;
    if (!enabled || !workspaceSlug || !projectId || !current) return;
    if (!projectIssueIds.current.has(predecessorId) || !projectIssueIds.current.has(successorId)) return;
    if (saving.current) {
      setToast({ type: TOAST_TYPE.WARNING, title: "Đang lưu phụ thuộc" });
      return;
    }
    if (!remove) {
      const error = validateNewDependency(current.dependencies, current.otherPairs, predecessorId, successorId);
      if (error) {
        setToast({ type: TOAST_TYPE.ERROR, title: "Không nối được", message: dependencyValidationMessages[error] });
        return;
      }
    } else if (
      !current.dependencies.some((dep) => dep.predecessorId === predecessorId && dep.successorId === successorId)
    ) {
      return;
    }
    const scope = generation.current;
    saving.current = true;
    requestCounter.current++;
    const dependency: TGanttDependency = { predecessorId, successorId };
    updateRelations({
      ...current,
      dependencies: remove
        ? current.dependencies.filter((dep) => dep.predecessorId !== predecessorId || dep.successorId !== successorId)
        : [...current.dependencies, dependency],
    });
    try {
      if (remove) {
        await relation.removeRelation(workspaceSlug, projectId, successorId, "blocked_by", predecessorId);
        // Refresh the inverse relation too: the shared store can leave its reverse list stale.
        await relation.fetchRelations(workspaceSlug, projectId, predecessorId).catch(console.error);
      } else {
        const created = await relation.createRelation(workspaceSlug, projectId, successorId, "blocked_by", [
          predecessorId,
        ]);
        if (!created.some((issue) => issue.id === predecessorId)) throw new Error("Dependency was not created");
      }
      if (scope !== generation.current) return;
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: remove ? "Đã xoá phụ thuộc" : "Đã nối phụ thuộc",
        actionItems: createElement(
          "button",
          {
            type: "button",
            className: "text-accent-primary",
            onClick: () => {
              if (scope === generation.current) void mutateDependency(predecessorId, successorId, !remove);
            },
          },
          "Hoàn tác"
        ),
      });
    } catch (error) {
      if (scope !== generation.current) return;
      updateRelations(current);
      setToast({ type: TOAST_TYPE.ERROR, title: "Không lưu được phụ thuộc" });
      console.error("Failed to save Gantt dependency", error);
    } finally {
      if (scope === generation.current) saving.current = false;
    }
  };

  const externalError = (error: unknown) => {
    const response = error as {
      status?: number;
      response?: { status?: number; data?: { message?: string; detail?: string } };
      message?: string;
      detail?: string;
    };
    const status = response?.response?.status ?? response?.status;
    const message =
      response?.response?.data?.message ??
      response?.response?.data?.detail ??
      response?.message ??
      response?.detail ??
      "";
    // The relation service throws the response body, so also recognize DRF permission messages.
    return status === 403 || /permission|forbidden|not allowed/i.test(message)
      ? "Không đủ quyền ở project bên kia"
      : message === "Circular dependency"
        ? "Nối như vậy sẽ tạo vòng lặp phụ thuộc"
        : status === 409
          ? "Hai việc đã có quan hệ khác (liên quan/trùng lặp) — xoá quan hệ đó trước"
          : "Không lưu được phụ thuộc";
  };

  const createExternal = async (
    localId: string,
    side: "left" | "right",
    externalIssueId: string,
    externalProjectId: string
  ) => {
    if (!enabled || !workspaceSlug || !projectId || !relationsRef.current || !projectIssueIds.current.has(localId))
      return;
    // Undo can run long after the click: both projects must still be writable by the user.
    if (
      externalProjectId === projectId ||
      (getProjectById(externalProjectId)?.member_role ?? 0) < 15 ||
      (getProjectById(projectId)?.member_role ?? 0) < 15
    )
      return;
    if (saving.current) {
      setToast({ type: TOAST_TYPE.WARNING, title: "Đang lưu phụ thuộc" });
      return;
    }
    const slug = workspaceSlug;
    const scope = generation.current;
    const [predecessorId, successorId, successorProjectId] =
      side === "right" ? [localId, externalIssueId, externalProjectId] : [externalIssueId, localId, projectId];
    saving.current = true;
    requestCounter.current++;
    try {
      const created = await relation.createRelation(workspaceSlug, successorProjectId, successorId, "blocked_by", [
        predecessorId,
      ]);
      if (!created.some((issue) => issue.id === predecessorId)) throw new Error("Dependency was not created");
    } catch (error) {
      if (scope === generation.current) setToast({ type: TOAST_TYPE.ERROR, title: externalError(error) });
      return;
    } finally {
      if (scope === generation.current) saving.current = false;
    }
    if (scope !== generation.current) return;
    await refreshRef.current();
    setToast({
      type: TOAST_TYPE.SUCCESS,
      title: "Đã nối phụ thuộc",
      actionItems: createElement(
        "button",
        { type: "button", className: "text-accent-primary", onClick: () => void undoCreateExternal() },
        "Hoàn tác"
      ),
    });

    async function undoCreateExternal() {
      // Same guard as removing: the user must still be able to write in both projects.
      if (scope !== generation.current || saving.current) return;
      if (
        (getProjectById(externalProjectId)?.member_role ?? 0) < 15 ||
        (getProjectById(projectId)?.member_role ?? 0) < 15
      )
        return;
      saving.current = true;
      requestCounter.current++;
      try {
        await relation.removeRelation(slug, successorProjectId, successorId, "blocked_by", predecessorId);
      } catch (error) {
        if (scope === generation.current) setToast({ type: TOAST_TYPE.ERROR, title: externalError(error) });
        return;
      } finally {
        if (scope === generation.current) saving.current = false;
      }
      if (scope === generation.current) await refreshRef.current();
    }
  };

  const removeExternal = async (link: TExternalLink) => {
    const current = relationsRef.current;
    if (!enabled || !workspaceSlug || !projectId || !current || !projectIssueIds.current.has(link.localId)) return;
    if ((getProjectById(link.projectId)?.member_role ?? 0) < 15) return;
    if (saving.current) {
      setToast({ type: TOAST_TYPE.WARNING, title: "Đang lưu phụ thuộc" });
      return;
    }
    const matches = (item: TExternalLink) =>
      item.localId === link.localId && item.direction === link.direction && item.externalId === link.externalId;
    if (!current.externalLinks.some(matches)) return;
    const scope = generation.current;
    const [predecessorId, successorId, successorProjectId] =
      link.direction === "pred"
        ? [link.externalId, link.localId, projectId]
        : [link.localId, link.externalId, link.projectId];
    saving.current = true;
    requestCounter.current++;
    updateRelations({ ...current, externalLinks: current.externalLinks.filter((item) => !matches(item)) });
    try {
      await relation.removeRelation(workspaceSlug, successorProjectId, successorId, "blocked_by", predecessorId);
      if (scope !== generation.current) return;
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Đã xoá phụ thuộc",
        actionItems: createElement(
          "button",
          {
            type: "button",
            className: "text-accent-primary",
            onClick: () => {
              if (scope === generation.current)
                void createExternal(
                  link.localId,
                  link.direction === "pred" ? "left" : "right",
                  link.externalId,
                  link.projectId
                );
            },
          },
          "Hoàn tác"
        ),
      });
    } catch (error) {
      if (scope !== generation.current) return;
      updateRelations(current);
      setToast({ type: TOAST_TYPE.ERROR, title: externalError(error) });
    } finally {
      if (scope === generation.current) saving.current = false;
    }
  };

  const setExternalLag = async (link: TExternalLink, lagDays: number) => {
    const current = relationsRef.current;
    if (!enabled || !workspaceSlug || !current || saving.current) return;
    if (!Number.isInteger(lagDays) || lagDays < -365 || lagDays > 365) {
      setToast({ type: TOAST_TYPE.ERROR, title: "Độ trễ phải là số nguyên từ -365 đến 365" });
      return;
    }
    const matches = (item: TExternalLink) =>
      item.localId === link.localId && item.direction === link.direction && item.externalId === link.externalId;
    if (!current.externalLinks.some(matches)) return;
    const [predecessorId, successorId] =
      link.direction === "pred" ? [link.externalId, link.localId] : [link.localId, link.externalId];
    const scope = generation.current;
    saving.current = true;
    requestCounter.current++;
    try {
      await scheduleService.setWorkspaceLag(workspaceSlug, predecessorId, successorId, lagDays, link.depType);
      if (scope !== generation.current) return;
      updateRelations({
        ...current,
        externalLinks: current.externalLinks.map((item) => (matches(item) ? { ...item, lagDays } : item)),
      });
    } catch (error) {
      if (scope !== generation.current) return;
      setToast({ type: TOAST_TYPE.ERROR, title: "Không lưu được độ trễ (cần quyền Member ở project của việc sau)" });
      console.error("Failed to save external Gantt lag", error);
    } finally {
      if (scope === generation.current) saving.current = false;
    }
  };

  const setExternalDepType = async (link: TExternalLink, depType: TDependencyType) => {
    const current = relationsRef.current;
    if (!enabled || !workspaceSlug || !current || saving.current) return;
    if ((link.depType ?? "FS") === depType) return;
    const matches = (item: TExternalLink) =>
      item.localId === link.localId && item.direction === link.direction && item.externalId === link.externalId;
    if (!current.externalLinks.some(matches)) return;
    const [predecessorId, successorId] =
      link.direction === "pred" ? [link.externalId, link.localId] : [link.localId, link.externalId];
    const scope = generation.current;
    saving.current = true;
    requestCounter.current++;
    try {
      await scheduleService.setWorkspaceLag(workspaceSlug, predecessorId, successorId, link.lagDays ?? 0, depType);
      if (scope !== generation.current) return;
      updateRelations({
        ...current,
        externalLinks: current.externalLinks.map((item) => (matches(item) ? { ...item, depType } : item)),
      });
    } catch (error) {
      if (scope !== generation.current) return;
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Không lưu được loại phụ thuộc (cần quyền Member ở project của việc sau)",
      });
      console.error("Failed to save external Gantt dependency type", error);
    } finally {
      if (scope === generation.current) saving.current = false;
    }
  };

  const setDepType = async (predecessorId: string, successorId: string, depType: TDependencyType) => {
    const current = relationsRef.current;
    if (!enabled || !workspaceSlug || !projectId || !current?.lagsSupported || saving.current) return;
    const existing = current.dependencies.find(
      (dep) => dep.predecessorId === predecessorId && dep.successorId === successorId
    );
    if (!existing || (existing.depType ?? "FS") === depType) return;
    const scope = generation.current;
    saving.current = true;
    requestCounter.current++;
    try {
      await scheduleService.setLag(
        workspaceSlug,
        projectId,
        predecessorId,
        successorId,
        existing.lagDays ?? 0,
        depType
      );
      if (scope !== generation.current) return;
      updateRelations({
        ...current,
        dependencies: current.dependencies.map((dep) => (dep === existing ? { ...dep, depType } : dep)),
      });
    } catch (error) {
      if (scope !== generation.current) return;
      setToast({ type: TOAST_TYPE.ERROR, title: "Không lưu được loại phụ thuộc" });
      console.error("Failed to save Gantt dependency type", error);
    } finally {
      if (scope === generation.current) saving.current = false;
    }
  };

  const setLag = async (predecessorId: string, successorId: string, lagDays: number) => {
    const current = relationsRef.current;
    if (!enabled || !workspaceSlug || !projectId || !current?.lagsSupported || saving.current) return;
    if (!Number.isInteger(lagDays) || lagDays < -365 || lagDays > 365) {
      setToast({ type: TOAST_TYPE.ERROR, title: "Độ trễ phải là số nguyên từ -365 đến 365" });
      return;
    }
    if (!current.dependencies.some((dep) => dep.predecessorId === predecessorId && dep.successorId === successorId))
      return;
    const scope = generation.current;
    saving.current = true;
    requestCounter.current++;
    try {
      await scheduleService.setLag(workspaceSlug, projectId, predecessorId, successorId, lagDays);
      if (scope !== generation.current) return;
      updateRelations({
        ...current,
        dependencies: current.dependencies.map((dep) =>
          dep.predecessorId === predecessorId && dep.successorId === successorId ? { ...dep, lagDays } : dep
        ),
      });
    } catch (error) {
      if (scope !== generation.current) return;
      setToast({ type: TOAST_TYPE.ERROR, title: "Không lưu được độ trễ" });
      console.error("Failed to save Gantt lag", error);
    } finally {
      if (scope === generation.current) saving.current = false;
    }
  };

  return !enabled || !workspaceSlug || !projectId || !relations
    ? undefined
    : {
        ...relations,
        externalLinks: [
          ...relations.externalLinks,
          ...peerLinksFromDependencies(relations.dependencies, relations.issueDates, projectId),
        ].flatMap((link) => {
          const project = getProjectById(link.projectId);
          return project?.member_role
            ? [
                {
                  ...link,
                  code: link.sequenceId === undefined ? undefined : `${project.identifier}-${link.sequenceId}`,
                },
              ]
            : [];
        }),
        refresh: () => refreshRef.current(),
        setLag,
        setDepType,
        setExternalLag,
        setExternalDepType,
        createExternal,
        removeExternal,
        createDependency: (pred: string, succ: string) => mutateDependency(pred, succ, false),
        removeDependency: (pred: string, succ: string) => mutateDependency(pred, succ, true),
      };
}
