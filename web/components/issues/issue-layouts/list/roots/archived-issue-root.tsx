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
import { IProjectStore } from "store_legacy/project";
import { EIssueActions } from "../../types";
import { EProjectStore } from "store_legacy/command-palette.store";

export const ArchivedIssueListLayout: FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query as { workspaceSlug: string; projectId: string };

  const { projectArchivedIssues: archivedIssueStore, projectArchivedIssuesFilter: archivedIssueFiltersStore } =
    useMobxStore();

  const issueActions = {
    [EIssueActions.DELETE]: async (group_by: string | null, issue: IIssue) => {
      if (!workspaceSlug || !projectId) return;

      await archivedIssueStore.removeIssue(workspaceSlug, projectId, issue.id);
    },
  };

  return (
    <BaseListRoot
      issueFilterStore={archivedIssueFiltersStore}
      issueStore={archivedIssueStore}
      QuickActions={ArchivedIssueQuickActions}
      issueActions={issueActions}
      currentStore={EProjectStore.PROJECT}
    />
  );
});
