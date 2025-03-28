"use client";

import { FC } from "react";
// components
import { EmptyState } from "@/components/common";
// hooks
import { useAppRouter } from "@/hooks/use-app-router";
// assets
import emptyIssue from "@/public/empty-state/issue.svg";

type TEpicEmptyStateProps = {
  workspaceSlug: string;
  projectId: string;
};

export const EpicEmptyState: FC<TEpicEmptyStateProps> = (props) => {
  const { workspaceSlug, projectId } = props;
  const router = useAppRouter();
  return (
    <EmptyState
      image={emptyIssue}
      title="Epic does not exist"
      description="The epic you are looking for does not exist, has been archived, or has been deleted."
      primaryButton={{
        text: "View other epics",
        onClick: () => router.push(`/${workspaceSlug}/projects/${projectId}/epics`),
      }}
    />
  );
};
