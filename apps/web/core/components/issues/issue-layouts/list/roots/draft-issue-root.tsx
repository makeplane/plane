import { FC } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// local imports
import { DraftIssueQuickActions } from "../../quick-action-dropdowns";
import { BaseListRoot } from "../base-list-root";

export const DraftIssueListLayout: FC = observer(() => {
  const { workspaceSlug, projectId } = useParams();

  if (!workspaceSlug || !projectId) return null;

  return <BaseListRoot QuickActions={DraftIssueQuickActions} />;
});
