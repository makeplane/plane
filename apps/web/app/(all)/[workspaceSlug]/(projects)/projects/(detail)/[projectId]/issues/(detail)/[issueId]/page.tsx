"use client";

import { useEffect } from "react";
import { observer } from "mobx-react";
import { useTheme } from "next-themes";
import useSWR from "swr";
import { useTranslation } from "@plane/i18n";
// components
import { EmptyState } from "@/components/common/empty-state";
import { LogoSpinner } from "@/components/common/logo-spinner";
// hooks
import { useAppRouter } from "@/hooks/use-app-router";
// assets
import emptyIssueDark from "@/public/empty-state/search/issues-dark.webp";
import emptyIssueLight from "@/public/empty-state/search/issues-light.webp";
// services
import { IssueService } from "@/services/issue/issue.service";

const issueService = new IssueService();

type IssueDetailsPageProps = {
  params: {
    workspaceSlug: string;
    projectId: string;
    issueId: string;
  };
};

function IssueDetailsPage({ params }: IssueDetailsPageProps) {
  const { workspaceSlug, projectId, issueId } = params;
  const router = useAppRouter();
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();

  const { data, isLoading, error } = useSWR(`ISSUE_DETAIL_META_${workspaceSlug}_${projectId}_${issueId}`, () =>
    issueService.getIssueMetaFromURL(workspaceSlug, projectId, issueId)
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
}

export default observer(IssueDetailsPage);
