import React from "react";
// swr
import useSWR from "swr";
// components
import { IssueRoot } from "components/issue-layouts/kanban";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";

const KanbanViewRoot = () => {
  const workspaceSlug: string = "plane-demo";
  const projectSlug: string = "5b0e3f6e-c9f1-444d-be22-a8c2706bcf54";

  const store: RootStore = useMobxStore();
  const { kanban: issueViewStore } = store;

  useSWR(`PROJECT_ISSUES_KANBAN_VIEW`, () => {
    if (workspaceSlug && projectSlug)
      issueViewStore.getIssuesAsync(workspaceSlug, projectSlug, "kanban");
  });

  return (
    <div>
      <IssueRoot />
    </div>
  );
};

export default KanbanViewRoot;
