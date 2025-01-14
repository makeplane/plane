"use client";

import { FC } from "react";
// components
import { EmptyState } from "@/components/common";
// hooks
import { useAppRouter } from "@/hooks/use-app-router";
// assets
import emptyIssue from "@/public/empty-state/issue.svg";

type TInitiativeEmptyStateProps = {
  workspaceSlug: string;
};

export const InitiativeEmptyState: FC<TInitiativeEmptyStateProps> = (props) => {
  const { workspaceSlug } = props;
  // router
  const router = useAppRouter();
  return (
    <EmptyState
      image={emptyIssue}
      title="Initiative does not exist"
      description="The Initiative you are looking for does not exist or has been deleted."
      primaryButton={{
        text: "View other initiatives",
        onClick: () => router.push(`/${workspaceSlug}/initiatives/`),
      }}
    />
  );
};
