import { FC } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
// hooks
import { ProjectIssueQuickActions } from "@/components/issues";
// components
// types
// constants
import { BaseListRoot } from "../base-list-root";

export const ListLayout: FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  if (!workspaceSlug || !projectId) return null;

  return <BaseListRoot QuickActions={ProjectIssueQuickActions} />;
});
