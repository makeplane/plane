/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
// plane imports
import { RESEARCH_PROJECT_STATUS_LABELS, RESEARCH_PROJECT_TYPE_LABELS, RESEARCH_PROJECT_TYPES } from "@plane/constants";
import type { TResearchProjectType } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TResearchProject } from "@/services/research/project.service";
import { AlertModalCore, Input } from "@plane/ui";
// components
import { getResearchErrorKey } from "@/components/research/common/error-messages";
import { ResearchListState } from "@/components/research/common/research-list-state";
// hooks
import { useResearch } from "@/hooks/store/use-research";

type Props = {
  workspaceSlug: string;
  currentUserId: string;
};

/** Personal cultivation and team research projects in the current scope. */
export const ResearchProjectList = observer(function ResearchProjectList({ workspaceSlug, currentUserId }: Props) {
  const { t } = useTranslation();
  const research = useResearch();
  const searchParams = useSearchParams();
  const [name, setName] = useState("");
  const [researchType, setResearchType] = useState<TResearchProjectType>("RESEARCH_PROJECT");
  const [orgUnit, setOrgUnit] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState(() => searchParams.get("workflow_status") ?? "");
  const [typeFilter, setTypeFilter] = useState(() => searchParams.get("research_type") ?? "");
  const [orgFilter, setOrgFilter] = useState(() => searchParams.get("org_unit") ?? "");
  const [ownerFilter, setOwnerFilter] = useState(() => searchParams.get("owner") ?? "");
  const [dateFrom, setDateFrom] = useState(() => searchParams.get("date_from") ?? "");
  const [dateTo, setDateTo] = useState(() => searchParams.get("date_to") ?? "");
  const [cursor, setCursor] = useState("");
  const [pendingProjectAction, setPendingProjectAction] = useState<{
    project: TResearchProject;
    action: "archive" | "restore";
  } | null>(null);
  const [isUpdatingProject, setIsUpdatingProject] = useState(false);

  const projects = research.getResearchProjects(workspaceSlug);
  const orgUnits = research.getOrgUnits(workspaceSlug);
  const pagination = research.projectPaginationByWorkspace[workspaceSlug];
  const orgUnitName = (unitId: string | null | undefined) => orgUnits.find((unit) => unit.id === unitId)?.name ?? "-";
  const memberOrgUnitIds = useMemo(
    () => new Set(research.identity?.user.org_units.map((membership) => membership.org_unit) ?? []),
    [research.identity]
  );
  const availableOrgUnits = useMemo(
    () =>
      research.identity?.user.is_workspace_admin ? orgUnits : orgUnits.filter((unit) => memberOrgUnitIds.has(unit.id)),
    [memberOrgUnitIds, orgUnits, research.identity?.user.is_workspace_admin]
  );
  const primaryOrgUnit = useMemo(
    () => research.identity?.user.org_units.find((membership) => membership.is_primary)?.org_unit ?? "",
    [research.identity]
  );
  const canCreateProject = Boolean(
    currentUserId && (research.identity?.user.org_units.length || research.isWorkspaceAdmin)
  );
  const isTeamProject = researchType === "RESEARCH_PROJECT";
  const requiresOrgUnit = !isTeamProject || !research.isWorkspaceAdmin;
  const hasActiveFilters = Boolean(typeFilter || orgFilter || ownerFilter.trim() || dateFrom || dateTo || statusFilter);
  const filterSummary = useMemo(
    () =>
      [
        typeFilter && t(RESEARCH_PROJECT_TYPE_LABELS[typeFilter as TResearchProjectType]),
        orgFilter && orgUnits.find((unit) => unit.id === orgFilter)?.name,
        ownerFilter.trim(),
        dateFrom && `${t("research.common.date_from")}: ${dateFrom}`,
        dateTo && `${t("research.common.date_to")}: ${dateTo}`,
        statusFilter && t(RESEARCH_PROJECT_STATUS_LABELS[statusFilter as keyof typeof RESEARCH_PROJECT_STATUS_LABELS]),
      ].filter((filter): filter is string => typeof filter === "string" && filter.length > 0),
    [dateFrom, dateTo, orgFilter, orgUnits, ownerFilter, statusFilter, t, typeFilter]
  );

  const load = useCallback(async () => {
    const params: Record<string, string> = { per_page: "50" };
    if (statusFilter) params.workflow_status = statusFilter;
    if (typeFilter) params.research_type = typeFilter;
    if (orgFilter) params.org_unit = orgFilter;
    if (ownerFilter) params.owner = ownerFilter.trim();
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;
    if (cursor) params.cursor = cursor;
    try {
      await research.fetchResearchProjects(workspaceSlug, params);
      setErrorKey(null);
    } catch (error) {
      setErrorKey(getResearchErrorKey(error));
    }
  }, [cursor, dateFrom, dateTo, orgFilter, ownerFilter, research, statusFilter, typeFilter, workspaceSlug]);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceSlug, statusFilter, typeFilter, orgFilter, ownerFilter, dateFrom, dateTo, cursor]);

  useEffect(() => setCursor(""), [statusFilter, typeFilter, orgFilter, ownerFilter, dateFrom, dateTo]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (statusFilter) params.set("workflow_status", statusFilter);
    if (typeFilter) params.set("research_type", typeFilter);
    if (orgFilter) params.set("org_unit", orgFilter);
    if (ownerFilter.trim()) params.set("owner", ownerFilter.trim());
    if (dateFrom) params.set("date_from", dateFrom);
    if (dateTo) params.set("date_to", dateTo);
    const query = params.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
  }, [dateFrom, dateTo, orgFilter, ownerFilter, statusFilter, typeFilter]);

  useEffect(() => {
    void research.fetchOrgUnits(workspaceSlug).catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceSlug]);

  useEffect(() => {
    if (!orgUnit && primaryOrgUnit) setOrgUnit(primaryOrgUnit);
  }, [orgUnit, primaryOrgUnit]);

  const handleCreate = useCallback(async () => {
    if (!name.trim() || (requiresOrgUnit && !orgUnit)) return;
    setIsCreating(true);
    try {
      const project = await research.createResearchProject(workspaceSlug, {
        name: name.trim(),
        owner: currentUserId,
        research_type: researchType,
        org_unit: orgUnit || null,
      });
      setName("");
      setErrorKey(null);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("research.feedback.project_created.title"),
        message: t("research.feedback.project_created.message"),
      });
      window.location.assign(
        researchType === "RESEARCH_PROJECT"
          ? `/${workspaceSlug}/projects/${project.id}/issues`
          : `/${workspaceSlug}/research/projects/${project.id}/stages`
      );
    } catch (error) {
      setErrorKey(getResearchErrorKey(error));
    } finally {
      setIsCreating(false);
    }
  }, [currentUserId, name, orgUnit, requiresOrgUnit, research, researchType, t, workspaceSlug]);

  const handleProjectAction = useCallback(async () => {
    if (!pendingProjectAction || isUpdatingProject) return;
    setIsUpdatingProject(true);
    try {
      if (pendingProjectAction.action === "archive") {
        await research.archiveResearchProject(workspaceSlug, pendingProjectAction.project.id);
      } else {
        await research.restoreResearchProject(workspaceSlug, pendingProjectAction.project.id);
      }
      await load();
      setErrorKey(null);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t(`research.feedback.project_${pendingProjectAction.action}d.title`),
        message: t(`research.feedback.project_${pendingProjectAction.action}d.message`),
      });
      setPendingProjectAction(null);
    } catch (error) {
      setErrorKey(getResearchErrorKey(error));
    } finally {
      setIsUpdatingProject(false);
    }
  }, [isUpdatingProject, load, pendingProjectAction, research, t, workspaceSlug]);

  const clearFilters = useCallback(() => {
    setStatusFilter("");
    setTypeFilter("");
    setOrgFilter("");
    setOwnerFilter("");
    setDateFrom("");
    setDateTo("");
  }, []);

  return (
    <div className="flex flex-col gap-3 p-5">
      {errorKey && (
        <div className="rounded-md border border-danger-strong/40 bg-danger-subtle px-3 py-2 text-12 text-danger-primary">
          {t(errorKey)}
        </div>
      )}

      {canCreateProject && (
        <section className="rounded-lg border border-subtle bg-surface-1 p-4">
          <h3 className="text-13 font-medium text-primary">{t("research.projects.create_title")}</h3>
          <p className="mt-1 text-11 text-tertiary">{t("research.projects.create_hint")}</p>
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
            <label className="flex flex-col gap-1 text-12 text-secondary">
              <span>{t("research.projects.fields.name")}</span>
              <Input
                placeholder={t("research.projects.name_placeholder")}
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1 text-12 text-secondary">
              <span>{t("research.projects.fields.type")}</span>
              <select
                className="rounded-md border border-subtle bg-surface-1 px-2 py-1.5 text-13 text-primary"
                value={researchType}
                onChange={(event) => setResearchType(event.target.value as TResearchProjectType)}
              >
                <optgroup label={t("research.projects.type_groups.cultivation")}>
                  {RESEARCH_PROJECT_TYPES.filter((type) => type !== "RESEARCH_PROJECT").map((type) => (
                    <option key={type} value={type}>
                      {t(RESEARCH_PROJECT_TYPE_LABELS[type])}
                    </option>
                  ))}
                </optgroup>
                <optgroup label={t("research.projects.type_groups.team")}>
                  <option value="RESEARCH_PROJECT">{t(RESEARCH_PROJECT_TYPE_LABELS.RESEARCH_PROJECT)}</option>
                </optgroup>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-12 text-secondary">
              <span>{t("research.projects.fields.org_unit")}</span>
              <select
                className="rounded-md border border-subtle bg-surface-1 px-2 py-1.5 text-13 text-primary"
                value={orgUnit}
                onChange={(event) => setOrgUnit(event.target.value)}
              >
                <option value="">{t("research.projects.org_unit_placeholder")}</option>
                {availableOrgUnits.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {!primaryOrgUnit && requiresOrgUnit && (
            <p className="mt-2 text-11 text-warning-primary">{t("research.projects.missing_primary_org")}</p>
          )}
          {!orgUnit && isTeamProject && research.isWorkspaceAdmin && (
            <p className="mt-2 text-11 text-tertiary">{t("research.projects.team_org_optional")}</p>
          )}
          <div className="mt-3 flex justify-end">
            <Button
              variant="primary"
              size="sm"
              loading={isCreating}
              disabled={!name.trim() || (requiresOrgUnit && !orgUnit) || !currentUserId}
              onClick={() => void handleCreate()}
            >
              {t("research.projects.create")}
            </Button>
          </div>
        </section>
      )}

      <div className="flex flex-wrap justify-end gap-2">
        <select
          aria-label={t("research.projects.fields.type")}
          className="rounded-md border border-subtle bg-surface-1 px-2 py-1.5 text-13 text-primary"
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value)}
        >
          <option value="">{t("research.projects.all_types")}</option>
          {RESEARCH_PROJECT_TYPES.map((type) => (
            <option key={type} value={type}>
              {t(RESEARCH_PROJECT_TYPE_LABELS[type])}
            </option>
          ))}
        </select>
        <select
          aria-label={t("research.projects.fields.org_unit")}
          className="rounded-md border border-subtle bg-surface-1 px-2 py-1.5 text-13 text-primary"
          value={orgFilter}
          onChange={(event) => setOrgFilter(event.target.value)}
        >
          <option value="">{t("research.projects.all_org_units")}</option>
          {orgUnits.map((unit) => (
            <option key={unit.id} value={unit.id}>
              {unit.name}
            </option>
          ))}
        </select>
        <Input
          aria-label={t("research.projects.columns.owner")}
          className="!w-48"
          placeholder={t("research.projects.owner_filter_placeholder")}
          value={ownerFilter}
          onChange={(event) => setOwnerFilter(event.target.value)}
        />
        <Input
          aria-label={t("research.common.date_from")}
          type="date"
          value={dateFrom}
          onChange={(event) => setDateFrom(event.target.value)}
        />
        <Input
          aria-label={t("research.common.date_to")}
          type="date"
          value={dateTo}
          onChange={(event) => setDateTo(event.target.value)}
        />
        <select
          className="rounded-md border border-subtle bg-surface-1 px-2 py-1.5 text-13 text-primary"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="">{t("research.projects.all_statuses")}</option>
          {(["ACTIVE", "ARCHIVED", "COMPLETED"] as const).map((status) => (
            <option key={status} value={status}>
              {t(RESEARCH_PROJECT_STATUS_LABELS[status])}
            </option>
          ))}
        </select>
      </div>

      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 text-11 text-tertiary">
          <span>{t("research.list_state.active_filters")}</span>
          {filterSummary.map((filter) => (
            <span key={filter} className="rounded bg-surface-2 px-2 py-0.5 text-secondary">
              {filter}
            </span>
          ))}
          <button type="button" className="text-accent-primary hover:underline" onClick={clearFilters}>
            {t("research.list_state.clear_filters")}
          </button>
        </div>
      )}

      {research.projectLoader && projects.length === 0 ? (
        <ResearchListState kind="loading" resource="projects" />
      ) : errorKey && projects.length === 0 ? (
        <ResearchListState kind="error" resource="projects" onRetry={() => void load()} />
      ) : projects.length === 0 ? (
        <ResearchListState
          kind={hasActiveFilters ? "no-results" : "empty"}
          resource="projects"
          onClearFilters={clearFilters}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[840px] text-12">
            <thead>
              <tr className="border-b border-subtle text-left text-tertiary">
                <th className="font-normal py-2">{t("research.projects.columns.name")}</th>
                <th className="font-normal py-2">{t("research.projects.columns.owner")}</th>
                <th className="font-normal py-2">{t("research.projects.columns.type")}</th>
                <th className="font-normal py-2">{t("research.projects.columns.org_unit")}</th>
                <th className="font-normal py-2">{t("research.projects.columns.status")}</th>
                <th className="font-normal py-2">{t("research.projects.columns.started_at")}</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project.id} className="border-b border-subtle/60">
                  <td className="py-2 text-secondary">{project.name}</td>
                  <td className="py-2 text-tertiary">
                    {project.research?.owner_detail?.display_name ||
                      project.research?.owner_detail?.email ||
                      project.research?.owner ||
                      "-"}
                  </td>
                  <td className="py-2 text-tertiary">
                    {project.research
                      ? t(RESEARCH_PROJECT_TYPE_LABELS[project.research.research_type as TResearchProjectType])
                      : "-"}
                  </td>
                  <td className="py-2 text-tertiary">{orgUnitName(project.research?.org_unit)}</td>
                  <td className="py-2 text-tertiary">
                    {project.research
                      ? t(
                          RESEARCH_PROJECT_STATUS_LABELS[
                            project.research.workflow_status as keyof typeof RESEARCH_PROJECT_STATUS_LABELS
                          ]
                        )
                      : "-"}
                  </td>
                  <td className="py-2 text-tertiary">{project.research?.started_at ?? "-"}</td>
                  <td className="py-2 text-right">
                    {project.research?.research_type === "RESEARCH_PROJECT" ? (
                      <Link
                        className="mr-2 text-12 text-accent-primary hover:underline"
                        href={`/${workspaceSlug}/projects/${project.id}/issues`}
                      >
                        {t("research.projects.open_team_project")}
                      </Link>
                    ) : (
                      <Link
                        className="mr-2 text-12 text-accent-primary hover:underline"
                        href={`/${workspaceSlug}/research/projects/${project.id}/stages`}
                      >
                        {t("research.nav.stages")}
                      </Link>
                    )}
                    {project.research?.owner === currentUserId &&
                      (project.research?.workflow_status === "ACTIVE" ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPendingProjectAction({ project, action: "archive" })}
                        >
                          {t("research.projects.archive")}
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPendingProjectAction({ project, action: "restore" })}
                        >
                          {t("research.projects.restore")}
                        </Button>
                      ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="flex items-center justify-between gap-2 text-12 text-tertiary">
        <span>{t("research.common.total_results", { count: pagination?.total_results ?? projects.length })}</span>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={!pagination?.prev_page_results}
            onClick={() => setCursor(pagination?.prev_cursor ?? "")}
          >
            {t("research.common.previous")}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={!pagination?.next_page_results}
            onClick={() => setCursor(pagination?.next_cursor ?? "")}
          >
            {t("research.common.next")}
          </Button>
        </div>
      </div>

      <AlertModalCore
        isOpen={Boolean(pendingProjectAction)}
        handleClose={() => {
          if (!isUpdatingProject) setPendingProjectAction(null);
        }}
        handleSubmit={() => void handleProjectAction()}
        isSubmitting={isUpdatingProject}
        title={t(`research.projects.confirm_${pendingProjectAction?.action ?? "archive"}_title`)}
        content={t(`research.projects.confirm_${pendingProjectAction?.action ?? "archive"}`, {
          project: pendingProjectAction?.project.name ?? "",
        })}
        primaryButtonText={{
          default: t(`research.projects.${pendingProjectAction?.action ?? "archive"}`),
          loading: t("research.common.loading"),
        }}
        secondaryButtonText={t("research.common.cancel")}
        variant={pendingProjectAction?.action === "archive" ? "danger" : "primary"}
      />
    </div>
  );
});
