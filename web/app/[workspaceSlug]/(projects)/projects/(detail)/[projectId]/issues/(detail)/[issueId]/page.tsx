"use client";

import { useEffect } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// components
import { LogoSpinner } from "@/components/common";
// hooks
import { useAppRouter } from "@/hooks/use-app-router";
// services
import { IssueService } from "@/services/issue/issue.service";

const issueService = new IssueService();

const IssueDetailsPage = observer(() => {
  const router = useAppRouter();
  const { workspaceSlug, projectId, issueId } = useParams();

  useEffect(() => {
    const redirectToBrowseUrl = async () => {
      if (!workspaceSlug || !projectId || !issueId) return;
      try {
        const meta = await issueService.getIssueMetaFromURL(
          workspaceSlug.toString(),
          projectId.toString(),
          issueId.toString()
        );
        router.push(`/${workspaceSlug}/browse/${meta.project_identifier}-${meta.sequence_id}`);
      } catch (error) {
        console.error(error);
      }
    };

    redirectToBrowseUrl();
  }, [workspaceSlug, projectId, issueId, router]);

  return (
    <div className="flex items-center justify-center size-full">
      <LogoSpinner />
    </div>
  );
});

export default IssueDetailsPage;
