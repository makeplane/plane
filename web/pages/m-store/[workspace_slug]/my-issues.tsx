import React from "react";
// next imports
import { useRouter } from "next/router";
// swr
// import useSWR from "swr";
// components
import { IssuesRoot } from "components/issue-layouts/root";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";

const KanBanViewRoot = () => {
  const router = useRouter();
  const { workspace_slug } = router.query as { workspace_slug: string };

  const store: RootStore = useMobxStore();
  const { issueView: issueViewStore } = store;

  // useSWR(`REVALIDATE_MY_ISSUES`, async () => {
  //   if (workspace_slug) await issueViewStore.getMyIssuesAsync(workspace_slug);
  // });

  React.useEffect(() => {
    console.log("request init--->");
    const init = async () => await issueViewStore.getMyIssuesAsync(workspace_slug);
    if (workspace_slug) init();
    console.log("request completed--->");
  }, [workspace_slug, issueViewStore]);

  return (
    <div className="w-screen min-h-[600px] h-screen">
      <IssuesRoot />
    </div>
  );
};

export default KanBanViewRoot;
