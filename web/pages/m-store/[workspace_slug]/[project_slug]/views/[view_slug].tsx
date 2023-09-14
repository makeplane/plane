import React from "react";
// next imports
import { useRouter } from "next/router";
// components
import { IssuesRoot } from "components/issue-layouts/root";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";

const KanBanViewRoot = () => {
  const router = useRouter();
  const { workspace_slug, project_slug, view_slug } = router.query as {
    workspace_slug: string;
    project_slug: string;
    view_slug: string;
  };

  const store: RootStore = useMobxStore();
  const { issueView: issueViewStore } = store;

  React.useEffect(() => {
    console.log("request init--->");
    const init = async () =>
      await issueViewStore.getIssuesForViewsAsync(workspace_slug, project_slug, view_slug);
    if (workspace_slug && project_slug && view_slug) init();
    console.log("request completed--->");
  }, [workspace_slug, project_slug, view_slug, issueViewStore]);

  return (
    <div className="w-screen min-h-[600px] h-screen">
      <IssuesRoot />
    </div>
  );
};

export default KanBanViewRoot;
