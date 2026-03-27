/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo } from "react";
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

  const { data: projects, isLoading, error } = useSWR(
    currentWorkspace?.slug ? `BANK_WIDE_PROJECTS_${currentWorkspace.slug}` : null,
    () => bankWideProjectsService.fetchAll(currentWorkspace!.slug)
  );

  // Group projects by workspace_slug, preserving backend order
  const grouped = useMemo(() => {
    if (!projects) return {};
    return projects.reduce<Record<string, IBankWideProject[]>>((acc, project) => {
      (acc[project.workspace_slug] ??= []).push(project);
      return acc;
    }, {});
  }, [projects]);

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
