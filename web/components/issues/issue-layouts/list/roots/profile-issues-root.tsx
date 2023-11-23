import { FC } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { ProjectIssueQuickActions } from "components/issues";
// types
import { IIssue } from "types";
import { EIssueActions } from "../../types";
import { IProjectStore } from "store/project";
//components
import { BaseListRoot } from "../base-list-root";

export const ProfileIssuesListLayout: FC = observer(() => {
  const {
    profileIssueFilters: profileIssueFiltersStore,
    profileIssues: profileIssuesStore,
    issueDetail: issueDetailStore,
  } = useMobxStore();

  const router = useRouter();
  const { workspaceSlug } = router.query;

  const issueActions = {
    [EIssueActions.UPDATE]: (group_by: string | null, issue: IIssue) => {
      if (!workspaceSlug) return;

      profileIssuesStore.updateIssueStructure(group_by, null, issue);
      issueDetailStore.updateIssue(workspaceSlug.toString(), issue.project, issue.id, issue);
    },
    [EIssueActions.DELETE]: (group_by: string | null, issue: IIssue) => {
      profileIssuesStore.deleteIssue(group_by, null, issue);
    },
  };

  const getProjects = (projectStore: IProjectStore) => projectStore?.workspaceProjects || null;

  return null;

  // return (
  //   <BaseListRoot
  //     issueFilterStore={profileIssueFiltersStore}
  //     issueStore={profileIssuesStore}
  //     QuickActions={ProjectIssueQuickActions}
  //     issueActions={issueActions}
  //     getProjects={getProjects}
  //   />
  // );
});
