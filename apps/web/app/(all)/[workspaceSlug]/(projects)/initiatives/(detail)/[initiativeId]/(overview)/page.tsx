"use client";

import React from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { useTheme } from "next-themes";
import useSWR from "swr";
import { useTranslation } from "@plane/i18n";
// ui
import { Loader } from "@plane/ui";
// components
import { EmptyState } from "@/components/common/empty-state";
import { PageHead } from "@/components/core/page-title";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useAppRouter } from "@/hooks/use-app-router";
// Plane-web
import { InitiativeDetailRoot } from "@/plane-web/components/initiatives/details/root";
import { useFlag, useWorkspaceFeatures } from "@/plane-web/hooks/store";
import { useProjectAdvanced } from "@/plane-web/hooks/store/projects/use-projects";
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
import { EWorkspaceFeatures } from "@/plane-web/types/workspace-feature";
// public
import emptyIssueDark from "@/public/empty-state/search/issues-dark.webp";
import emptyIssueLight from "@/public/empty-state/search/issues-light.webp";

const IssueDetailsPage = observer(() => {
  // router
  const router = useAppRouter();
  const { workspaceSlug, initiativeId } = useParams();
  // hooks
  const { resolvedTheme } = useTheme();
  // store hooks
  const { fetchProjectAnalyticsCount } = useProject();
  const { fetchProjectAttributes } = useProjectAdvanced();
  const {
    initiative: { getInitiativeById, fetchInitiativeDetails },
  } = useInitiatives();

  const { t } = useTranslation();

  const { isWorkspaceFeatureEnabled } = useWorkspaceFeatures();
  // fetching issue details
  const { isLoading, error } = useSWR(
    workspaceSlug && initiativeId ? `INITIATIVE_DETAIL_${workspaceSlug}_${initiativeId}` : null,
    workspaceSlug && initiativeId
      ? () => fetchInitiativeDetails(workspaceSlug.toString(), initiativeId.toString())
      : null
  );
  // derived values
  const initiativeDetails = getInitiativeById(initiativeId.toString());
  const loader = !initiativeDetails || isLoading;
  const pageTitle = initiativeDetails ? `Initiative - ${initiativeDetails.name}` : "Initiative";
  const isProjectGroupingEnabled =
    isWorkspaceFeatureEnabled(EWorkspaceFeatures.IS_PROJECT_GROUPING_ENABLED) &&
    useFlag(workspaceSlug.toString(), "PROJECT_GROUPING");
  // fetch initiative project analytics count
  useSWR(
    workspaceSlug && initiativeDetails?.project_ids && initiativeDetails?.project_ids.length > 0
      ? ["initiativeProjectAnalyticsCount", workspaceSlug, ...initiativeDetails?.project_ids]
      : null,
    workspaceSlug && initiativeDetails?.project_ids && initiativeDetails?.project_ids.length > 0
      ? () =>
          fetchProjectAnalyticsCount(workspaceSlug.toString(), {
            project_ids: initiativeDetails?.project_ids?.join(","),
            fields: "total_issues,completed_issues",
          })
      : null
  );
  // fetch initiative project attributes
  useSWR(
    workspaceSlug &&
      isProjectGroupingEnabled &&
      initiativeDetails?.project_ids &&
      initiativeDetails?.project_ids.length > 0
      ? ["initiativeProjectAttributes", workspaceSlug, isProjectGroupingEnabled, ...initiativeDetails?.project_ids]
      : null,
    workspaceSlug &&
      isProjectGroupingEnabled &&
      initiativeDetails?.project_ids &&
      initiativeDetails?.project_ids.length > 0
      ? () =>
          fetchProjectAttributes(workspaceSlug.toString(), {
            project_ids: initiativeDetails?.project_ids?.join(","),
          })
      : null
  );

  return (
    <>
      <PageHead title={pageTitle} />
      {error ? (
        <EmptyState
          image={resolvedTheme === "dark" ? emptyIssueDark : emptyIssueLight}
          title={t("initiatives.empty_state.not_found.title")}
          description={t("initiatives.empty_state.not_found.description")}
          primaryButton={{
            text: t("initiatives.empty_state.not_found.primary_button.title"),
            onClick: () => router.push(`/${workspaceSlug}/initiatives`),
          }}
        />
      ) : loader ? (
        <Loader className="flex h-full gap-5 p-5">
          <div className="basis-2/3 space-y-2">
            <Loader.Item height="30px" width="40%" />
            <Loader.Item height="15px" width="60%" />
            <Loader.Item height="15px" width="60%" />
            <Loader.Item height="15px" width="40%" />
          </div>
          <div className="basis-1/3 space-y-3">
            <Loader.Item height="30px" />
            <Loader.Item height="30px" />
            <Loader.Item height="30px" />
            <Loader.Item height="30px" />
          </div>
        </Loader>
      ) : (
        workspaceSlug &&
        initiativeDetails && (
          <InitiativeDetailRoot workspaceSlug={workspaceSlug.toString()} initiativeId={initiativeId.toString()} />
        )
      )}
    </>
  );
});

export default IssueDetailsPage;
