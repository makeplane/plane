"use client";

import { useEffect } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { useTheme } from "next-themes";
import useSWR from "swr";
import { useTranslation } from "@plane/i18n";
// assets
import emptyIssueDark from "@/app/assets/empty-state/search/issues-dark.webp?url";
import emptyIssueLight from "@/app/assets/empty-state/search/issues-light.webp?url";
// components
import { EmptyState } from "@/components/common/empty-state";
import { LogoSpinner } from "@/components/common/logo-spinner";
// hooks
import { useAppRouter } from "@/hooks/use-app-router";
// services
import { IssueService } from "@/services/issue/issue.service";

const issueService = new IssueService();

const IssueDetailsPage = observer(() => {
  const router = useAppRouter();
  const { t } = useTranslation();
  const { workspaceSlug, projectId, issueId } = useParams();
  const { resolvedTheme } = useTheme();

  const { data, isLoading, error } = useSWR(
    workspaceSlug && projectId && issueId ? `ISSUE_DETAIL_META_${workspaceSlug}_${projectId}_${issueId}` : null,
    workspaceSlug && projectId && issueId
      ? () => issueService.getIssueMetaFromURL(workspaceSlug.toString(), projectId.toString(), issueId.toString())
      : null
  );

  useEffect(() => {
    if (data) {
      router.push(`/${workspaceSlug}/browse/${data.project_identifier}-${data.sequence_id}`);
    }
  }, [workspaceSlug, data]);

  return (
    <div className="flex items-center justify-center size-full">
      {error ? (
        <EmptyState
          image={resolvedTheme === "dark" ? emptyIssueDark : emptyIssueLight}
          title={t("issue.empty_state.issue_detail.title")}
          description={t("issue.empty_state.issue_detail.description")}
          primaryButton={{
            text: t("issue.empty_state.issue_detail.primary_button.text"),
            onClick: () => router.push(`/${workspaceSlug}/workspace-views/all-issues/`),
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
  );
});

export default IssueDetailsPage;
