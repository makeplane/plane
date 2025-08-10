"use client";

import React from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { useTheme } from "next-themes";
import useSWR from "swr";
import { useTranslation } from "@plane/i18n";
// components
import { EmptyState } from "@/components/common";
import { PageHead } from "@/components/core";
import { ListLayoutLoader } from "@/components/ui";
// hooks
import { useProject } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
import { InitiativeScopeRoot } from "@/plane-web/components/initiatives/scope/root";
// Plane-web
import { useFlag } from "@/plane-web/hooks/store";
import * as store from "@/plane-web/hooks/store";
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
    initiative: {
      getInitiativeById,
      fetchInitiativeDetails,
      epics: { fetchInitiativeEpicsDetail },
    },
  } = useInitiatives();

  const { t } = useTranslation();

  const { isWorkspaceFeatureEnabled } = store.useWorkspaceFeatures();
  // fetching issue details
  const { isLoading, error } = useSWR(
    workspaceSlug && initiativeId ? `INITIATIVE_DETAIL_${workspaceSlug}_${initiativeId}` : null,
    workspaceSlug && initiativeId
      ? () => fetchInitiativeDetails(workspaceSlug.toString(), initiativeId.toString())
      : null
  );

  // fetch initiative epics
  const { isLoading: isEpicsLoading } = useSWR(
    workspaceSlug && initiativeId ? `INITIATIVE_EPICS_${workspaceSlug}_${initiativeId}` : null,
    workspaceSlug && initiativeId
      ? () => fetchInitiativeEpicsDetail(workspaceSlug.toString(), initiativeId.toString())
      : null
  );

  // derived values
  const initiativeDetails = getInitiativeById(initiativeId.toString());
  const loader = !initiativeDetails || isLoading || isEpicsLoading;
  const pageTitle = initiativeDetails ? `Initiative - ${initiativeDetails.name} | Scope` : "Initiative | Scope";
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
        <ListLayoutLoader />
      ) : (
        workspaceSlug && initiativeDetails && <InitiativeScopeRoot />
      )}
    </>
  );
});

export default IssueDetailsPage;
