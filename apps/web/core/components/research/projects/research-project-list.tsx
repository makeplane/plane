/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useEffect, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { RESEARCH_PROJECT_STATUS_LABELS, RESEARCH_PROJECT_TYPE_LABELS, RESEARCH_PROJECT_TYPES } from "@plane/constants";
import type { TResearchProjectType } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { Input } from "@plane/ui";
// components
import { getResearchErrorKey } from "@/components/research/common/error-messages";
// hooks
import { useResearch } from "@/hooks/store/use-research";

type Props = {
  workspaceSlug: string;
  currentUserId: string;
};

/**
 * Personal research project overview: one active project per research owner
 * (P0-PRJ-01 ~ P0-PRJ-08).
 */
export const ResearchProjectList = observer(function ResearchProjectList({ workspaceSlug, currentUserId }: Props) {
  const { t } = useTranslation();
  const research = useResearch();
  const [ownerEmail, setOwnerEmail] = useState("");
  const [researchType, setResearchType] = useState<TResearchProjectType>("RESEARCH_PROJECT");
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");

  const projects = research.getResearchProjects(workspaceSlug);
  const orgUnits = research.getOrgUnits(workspaceSlug);
  const orgUnitName = (unitId: string | null | undefined) => orgUnits.find((unit) => unit.id === unitId)?.name ?? "-";

  useEffect(() => {
    void research.fetchResearchProjects(workspaceSlug, statusFilter ? { workflow_status: statusFilter } : {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceSlug, statusFilter]);

  useEffect(() => {
    if (research.orgUnits[Object.keys(research.orgUnits)[0] ?? ""] === undefined) {
      void research.fetchOrgUnits(workspaceSlug).catch(() => undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceSlug]);

  const handleCreate = useCallback(async () => {
    try {
      await research.createResearchProject(workspaceSlug, {
        owner: ownerEmail.trim() || currentUserId,
        research_type: researchType,
      });
      setOwnerEmail("");
      setErrorKey(null);
    } catch (error) {
      setErrorKey(getResearchErrorKey(error));
    }
  }, [currentUserId, ownerEmail, research, researchType, workspaceSlug]);

  const handleArchive = useCallback(
    async (projectId: string) => {
      try {
        await research.archiveResearchProject(workspaceSlug, projectId);
        setErrorKey(null);
      } catch (error) {
        setErrorKey(getResearchErrorKey(error));
      }
    },
    [research, workspaceSlug]
  );

  const handleRestore = useCallback(
    async (projectId: string) => {
      try {
        await research.restoreResearchProject(workspaceSlug, projectId);
        setErrorKey(null);
      } catch (error) {
        setErrorKey(getResearchErrorKey(error));
      }
    },
    [research, workspaceSlug]
  );

  return (
    <div className="flex flex-col gap-3 p-5">
      {errorKey && (
        <div className="rounded-md border border-danger-strong/40 bg-danger-subtle px-3 py-2 text-12 text-danger-primary">
          {t(errorKey)}
        </div>
      )}

      <div className="flex flex-wrap items-end gap-2">
        <Input
          className="!w-56"
          placeholder={t("research.projects.owner_placeholder")}
          value={ownerEmail}
          onChange={(event) => setOwnerEmail(event.target.value)}
        />
        <select
          className="rounded-md border border-subtle bg-surface-1 px-2 py-1.5 text-13 text-primary"
          value={researchType}
          onChange={(event) => setResearchType(event.target.value as TResearchProjectType)}
        >
          {RESEARCH_PROJECT_TYPES.map((type) => (
            <option key={type} value={type}>
              {t(RESEARCH_PROJECT_TYPE_LABELS[type])}
            </option>
          ))}
        </select>
        <Button variant="primary" size="sm" onClick={() => void handleCreate()}>
          {t("research.projects.create")}
        </Button>
        <select
          className="ml-auto rounded-md border border-subtle bg-surface-1 px-2 py-1.5 text-13 text-primary"
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

      <table className="w-full text-12">
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
              <td className="py-2 text-tertiary">{project.research?.owner ?? "-"}</td>
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
                {project.research?.workflow_status === "ACTIVE" ? (
                  <Button variant="ghost" size="sm" onClick={() => void handleArchive(project.id)}>
                    {t("research.projects.archive")}
                  </Button>
                ) : (
                  <Button variant="ghost" size="sm" onClick={() => void handleRestore(project.id)}>
                    {t("research.projects.restore")}
                  </Button>
                )}
              </td>
            </tr>
          ))}
          {projects.length === 0 && (
            <tr>
              <td colSpan={7} className="py-3 text-center text-tertiary">
                {t("research.projects.empty")}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
});
