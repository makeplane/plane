import React from "react";
// mobx react lite
import { observer } from "mobx-react-lite";
// mobx store
import { RootStore } from "store/root";
import { TIssueLayouts } from "store/issue-views/issue_filters";
import { useMobxStore } from "lib/mobx/store-provider";

export const IssuesRoot = observer(() => {
  const store: RootStore = useMobxStore();
  const { issueFilters: issueFilterStore, issueView: issueStore } = store;

  return <div>issue root</div>;
});
