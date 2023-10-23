// components
import { ProjectLayoutRoot } from "components/issues";
import { ProjectIssuesHeader } from "components/headers";
// types
import type { NextPage } from "next";
// layouts
import { AppLayout } from "layouts/app-layout";

const ProjectIssues: NextPage = () => (
  <AppLayout header={<ProjectIssuesHeader />} withProjectWrapper>
    <div className="h-full w-full">
      <ProjectLayoutRoot />
    </div>
  </AppLayout>
);

export default ProjectIssues;
