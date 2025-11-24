import { observer } from "mobx-react";
// i18n
import { useTranslation } from "@plane/i18n";
// components
import { PageHead } from "@/components/core/page-title";
import { ProjectLayoutRoot } from "@/components/issues/issue-layouts/roots/project-layout-root";
// hooks
import { useProject } from "@/hooks/store/use-project";
import type { Route } from "./+types/page";

function ProjectIssuesPage({ params }: Route.ComponentProps) {
  const { projectId } = params;
  // i18n
  const { t } = useTranslation();
  // store
  const { getProjectById } = useProject();

  // derived values
  const project = getProjectById(projectId);
  const pageTitle = project?.name ? `${project?.name} - ${t("issue.label", { count: 2 })}` : undefined; // Count is for pluralization

  return (
    <>
      <PageHead title={pageTitle} />
      <div className="h-full w-full">
        <ProjectLayoutRoot />
      </div>
    </>
  );
}

export default observer(ProjectIssuesPage);
