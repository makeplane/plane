"use client";

import { observer } from "mobx-react";
import Head from "next/head";
import { useParams } from "next/navigation";
import { useTranslation } from "@plane/i18n";
// components
import { PageHead } from "@/components/core";
import { ProjectLayoutRoot } from "@/components/issues";
// hooks
import { useProject } from "@/hooks/store";

const ProjectIssuesPage = observer(() => {
  const { projectId } = useParams();
  // store
  const { getProjectById } = useProject();
  const { t } = useTranslation();
  if (!projectId) {
    return <></>;
  }

  // derived values
  const project = getProjectById(projectId.toString());
  const pageTitle = project?.name ? `${project?.name} - ${t("issues")}` : undefined;

  return (
    <>
      <PageHead title={pageTitle} />
      <Head>
        <title>
          {project?.name} - {t("issues")}
        </title>
      </Head>
      <div className="h-full w-full">
        <ProjectLayoutRoot />
      </div>
    </>
  );
});

export default ProjectIssuesPage;
