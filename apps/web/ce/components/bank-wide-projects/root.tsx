/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo } from "react";
import { useSearchParams } from "react-router";
import useSWR from "swr";
import { useTranslation } from "@plane/i18n";
import { EmptyStateDetailed } from "@plane/propel/empty-state";
import type { IBankWideProject } from "@plane/types";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { ProjectsLoader } from "@/components/ui/loader/projects-loader";
import { BankWideProjectsService } from "@/plane-web/services/bank-wide-projects.service";
import { BankWideProjectCard } from "./project-card";

const bankWideProjectsService = new BankWideProjectsService();

export const BankWideProjectsRoot = function BankWideProjectsRoot() {
  const { currentWorkspace } = useWorkspace();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("search")?.toLowerCase() ?? "";
  const fromDate = searchParams.get("from_date") ?? "";
  const toDate = searchParams.get("to_date") ?? "";
  const showArchived = searchParams.get("show_archived") === "true";
  const workspaceSlug = searchParams.get("workspace_slug") ?? "";

  const swrKey = currentWorkspace?.slug ? `BANK_WIDE_PROJECTS_${currentWorkspace.slug}_${showArchived}` : null;
  const {
    data: projects,
    isLoading,
    error,
  } = useSWR(swrKey, () => bankWideProjectsService.fetchAll(currentWorkspace!.slug, showArchived));

  // Filter by search query and date range (created_at), then group by workspace_slug
  const grouped = useMemo(() => {
    if (!projects) return {};
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;
    // extend to end-of-day so "to date" is inclusive
    if (to) to.setHours(23, 59, 59, 999);

    const filtered = projects.filter((p) => {
      if (workspaceSlug && p.workspace_slug !== workspaceSlug) return false;
      if (searchQuery && !p.name.toLowerCase().includes(searchQuery)) return false;
      if (from || to) {
        if (!p.created_at) return true;
        const created = new Date(p.created_at);
        if (from && created < from) return false;
        if (to && created > to) return false;
      }
      return true;
    });

    return filtered.reduce<Record<string, IBankWideProject[]>>((acc, project) => {
      (acc[project.workspace_slug] ??= []).push(project);
      return acc;
    }, {});
  }, [projects, searchQuery, fromDate, toDate, workspaceSlug]);

  if (isLoading) return <ProjectsLoader />;

  if (error) {
    return (
      <EmptyStateDetailed
        title={t("something_went_wrong")}
        description={t("bank_wide_projects.empty_state")}
        assetKey="project"
        assetClassName="size-40"
      />
    );
  }

  if (!projects || projects.length === 0) {
    return (
      <EmptyStateDetailed
        title={t("bank_wide_projects.title")}
        description={t("bank_wide_projects.empty_state")}
        assetKey="project"
        assetClassName="size-40"
      />
    );
  }

  return (
    <div className="p-8 space-y-10">
      {Object.entries(grouped).map(([workspaceSlug, workspaceProjects]) => (
        <section key={workspaceSlug}>
          <h3 className="text-xs font-semibold text-secondary uppercase tracking-wider mb-4">
            {workspaceProjects[0].workspace_name}
          </h3>
          {/* Same grid as ProjectCardList */}
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {workspaceProjects.map((project) => (
              <BankWideProjectCard key={project.id} project={project} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};
