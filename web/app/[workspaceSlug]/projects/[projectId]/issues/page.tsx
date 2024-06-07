"use client";

import { observer } from "mobx-react";
import Head from "next/head";
import { useParams } from "next/navigation";
// components
import { PageHead } from "@/components/core";
import { ProjectLayoutRoot } from "@/components/issues";
// hooks
import { useProject } from "@/hooks/store";

const ProjectIssuesPage = observer(() => {
  const { projectId } = useParams();
  // store
  const { getProjectById } = useProject();

  if (!projectId) {
    return <></>;
  }

  // derived values
  const project = getProjectById(projectId.toString());
  const pageTitle = project?.name ? `${project?.name} - Issues` : undefined;

  return (
    <>
      <PageHead title={pageTitle} />
      <Head>
        <title>{project?.name} - Issues</title>
      </Head>
      <div className="h-full w-full">
        <ProjectLayoutRoot />
      </div>
    </>
  );
});

export default ProjectIssuesPage;
