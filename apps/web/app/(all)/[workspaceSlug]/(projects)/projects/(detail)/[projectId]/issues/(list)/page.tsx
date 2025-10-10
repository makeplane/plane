"use client";

import { observer } from "mobx-react";
import Head from "next/head";
import { useParams } from "next/navigation";
// i18n
import { useTranslation } from "@plane/i18n";
// components
import { PageHead } from "@/components/core/page-title";
import { ProjectLayoutRoot } from "@/components/issues/issue-layouts/roots/project-layout-root";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useEffect, useState } from "react";
import { projectIssueTypesCache, ProjectIssueTypeService, TIssueType } from "@/services/project";

const ProjectIssuesPage = observer(() => {
  const { projectId } = useParams();
  // i18n
  const { t } = useTranslation();
  // store
  const { getProjectById } = useProject();

  if (!projectId) {
    return <></>;
  }

  // derived values
  const project = getProjectById(projectId.toString());
  const pageTitle = project?.name ? `${project?.name} - ${t("issue.label", { count: 2 })}` : undefined; // Count is for pluralization
  const [projectIssueTypesMap, setProjectIssueTypesMap] = useState<Record<string, TIssueType> | undefined>(undefined);
  const { workspaceSlug } = useParams();
  useEffect(() => {
    const ws = workspaceSlug?.toString();
    const pid = projectId?.toString();
    if (!ws || !pid) return;

    const svc = new ProjectIssueTypeService();
    svc
      .fetchProjectIssueTypes(ws, pid)
      .then((list) => {
        const map: Record<string, TIssueType> = {};
        list?.forEach((t) => {
          if (t?.id) map[t.id] = t;
        });
        projectIssueTypesCache.set(pid, map);
        setProjectIssueTypesMap(map);
      })
      .catch(() => {
        // 静默失败，不影响页面其他功能
      });
  }, [workspaceSlug, projectId]);

  return (
    <>
      <PageHead title={pageTitle} />
      <Head>
        <title>
          {project?.name} - {t("issue.label", { count: 2 })}
        </title>
      </Head>
      <div className="h-full w-full">
        <ProjectLayoutRoot />
      </div>
    </>
  );
});

export default ProjectIssuesPage;
