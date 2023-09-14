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
  const { workspace_slug, project_slug, cycle_slug } = router.query as {
    workspace_slug: string;
    project_slug: string;
    cycle_slug: string;
  };

  const store: RootStore = useMobxStore();
  const { issueView: issueViewStore } = store;

  React.useEffect(() => {
    console.log("request init--->");
    const init = async () =>
      await issueViewStore.getIssuesForCyclesAsync(workspace_slug, project_slug, cycle_slug);
    if (workspace_slug && project_slug && cycle_slug) init();
    console.log("request completed--->");
  }, [workspace_slug, project_slug, cycle_slug, issueViewStore]);

  return (
    <div className="w-screen min-h-[600px] h-screen">
      <IssuesRoot />
    </div>
  );
};

export default KanBanViewRoot;
