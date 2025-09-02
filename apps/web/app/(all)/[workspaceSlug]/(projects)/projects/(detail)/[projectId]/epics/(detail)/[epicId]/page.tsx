"use client";

import React, { useEffect } from "react";
import { observer } from "mobx-react";
import { redirect, useParams } from "next/navigation";
import { useTheme } from "next-themes";
import useSWR from "swr";
// components
import { EmptyState } from "@/components/common/empty-state";
import { LogoSpinner } from "@/components/common/logo-spinner";
// hooks
import { useAppRouter } from "@/hooks/use-app-router";
// plane web
import { EpicService } from "@/plane-web/services/issue-types";
// assets
import emptyIssueDark from "@/public/empty-state/search/issues-dark.webp";
import emptyIssueLight from "@/public/empty-state/search/issues-light.webp";

const epicService = new EpicService();

const EpicDetailsPage = observer(() => {
  // router
  const router = useAppRouter();
  const { workspaceSlug, projectId, epicId } = useParams();
  // hooks
  const { resolvedTheme } = useTheme();

  const { data, isLoading, error } = useSWR(
    workspaceSlug && projectId && epicId ? `ISSUE_DETAIL__META_${workspaceSlug}_${projectId}_${epicId}` : null,
    workspaceSlug && projectId && epicId
      ? () => epicService.getEpicMetaFromURL(workspaceSlug.toString(), projectId.toString(), epicId.toString())
      : null
  );

  useEffect(() => {
    if (data) {
      redirect(`/${workspaceSlug}/browse/${data.project_identifier}-${data.sequence_id}`);
    }
  }, [workspaceSlug, data]);

  return (
    <>
      <div className="flex items-center justify-center size-full">
        {error ? (
          <EmptyState
            image={resolvedTheme === "dark" ? emptyIssueDark : emptyIssueLight}
            title="Epic does not exist"
            description="The epic you are looking for does not exist, has been archived, or has been deleted."
            primaryButton={{
              text: "View other epics",
              onClick: () => router.push(`/${workspaceSlug}/projects/${projectId}/epics`),
            }}
          />
        ) : isLoading ? (
          <>
            <LogoSpinner />
          </>
        ) : (
          <></>
        )}
      </div>
    </>
  );
});

export default EpicDetailsPage;
