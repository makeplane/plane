import { FC } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// hooks
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { ArchivedIssueQuickActions } from "components/issues";
// types
import { IIssue } from "types";
// constants
import { BaseListRoot } from "../base-list-root";
import { IProjectStore } from "store/project";
import { EIssueActions } from "../../types";

export const ArchivedIssueListLayout: FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { archivedIssues: archivedIssueStore, archivedIssueFilters: archivedIssueFiltersStore } = useMobxStore();

  const issueActions = {
    [EIssueActions.DELETE]: (group_by: string | null, issue: IIssue) => {
      if (!workspaceSlug || !projectId) return;

      archivedIssueStore.deleteArchivedIssue(group_by, null, issue);
    },
  };

  const getProjects = (projectStore: IProjectStore) => {
    if (!workspaceSlug) return null;
    return projectStore?.projects[workspaceSlug.toString()] || null;
  };

  return null;

  // return (
  //   <BaseListRoot
  //     issueFilterStore={archivedIssueFiltersStore}
  //     issueStore={archivedIssueStore}
  //     QuickActions={ArchivedIssueQuickActions}
  //     issueActions={issueActions}
  //     getProjects={getProjects}
  //   />
  // );
});
