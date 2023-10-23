// layouts
import { AppLayout } from "layouts/app-layout";
// components
import { ProjectViewLayoutRoot } from "components/issues";
// fetch-keys
import { ProjectViewIssueHeader } from "components/headers";

const SingleView: React.FC = () => (
  <AppLayout header={<ProjectViewIssueHeader />}>
    <ProjectViewLayoutRoot />
  </AppLayout>
);

export default SingleView;
