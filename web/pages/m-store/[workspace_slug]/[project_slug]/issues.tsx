import React from "react";
// next imports
import { useRouter } from "next/router";
// components
import { IssuesRoot } from "components/issue-layouts/root";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";
import useSWR from "swr";

const KanBanViewRoot = () => {
  const router = useRouter();
  const { workspace_slug, project_slug } = router.query as {
    workspace_slug: string;
    project_slug: string;
  };

  const {
    issue: issueViewStore,
    workspace: workspaceStore,
    project: projectStore,
    issueFilter: issueFilterStore,
  }: RootStore = useMobxStore();

  useSWR(
    workspace_slug && project_slug ? "USER_FILTERS" : null,
    workspace_slug && project_slug
      ? () => {
          console.log("sdad");
          issueFilterStore.fetchUserFilters(workspace_slug.toString(), project_slug.toString());
        }
      : null
  );

  React.useEffect(() => {
    console.log("request init--->");
    const init = async () => {
      // workspaceStore.setWorkspaceId(workspace_slug);
      // await workspaceStore.getWorkspaces();
      // await workspaceStore.getWorkspaceLabels(workspace_slug);
      // projectStore.setProject(project_slug);
      // await projectStore.getWorkspaceProjects(workspace_slug);
      // await projectStore.getProjectStates(workspace_slug, project_slug);
      // await projectStore.getProjectLabels(workspace_slug, project_slug);
      // await projectStore.getProjectMembers(workspace_slug, project_slug);
      // await issueViewStore.getProjectIssuesAsync(workspace_slug, project_slug);
    };
    if (workspace_slug && project_slug) init();
    console.log("request completed--->");
  }, [workspace_slug, project_slug, issueViewStore, workspaceStore, projectStore]);

  return <div className="w-screen min-h-[600px] h-screen">{/* <IssuesRoot /> */}</div>;
};

export default KanBanViewRoot;
