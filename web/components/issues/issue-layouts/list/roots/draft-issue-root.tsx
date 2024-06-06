import { FC } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// hooks
import { DraftIssueQuickActions } from "@/components/issues";
import { EIssuesStoreType } from "@/constants/issue";
// components
// types
// constants
import { BaseListRoot } from "../base-list-root";

export const DraftIssueListLayout: FC = observer(() => {
  const { workspaceSlug, projectId } = useParams();

  if (!workspaceSlug || !projectId) return null;

  return <BaseListRoot QuickActions={DraftIssueQuickActions} storeType={EIssuesStoreType.DRAFT} />;
});
