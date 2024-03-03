import { FC } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// components
import { ProjectIssueQuickActions } from "components/issues";
// constants
import { BaseListRoot } from "../base-list-root";
import { EIssuesStoreType } from "constants/issue";

export const DraftIssueListLayout: FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  if (!workspaceSlug || !projectId) return null;

  return <BaseListRoot QuickActions={ProjectIssueQuickActions} storeType={EIssuesStoreType.DRAFT} />;
});
