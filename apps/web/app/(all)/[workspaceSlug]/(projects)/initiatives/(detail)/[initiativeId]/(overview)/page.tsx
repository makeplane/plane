/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { observer } from "mobx-react";
import { useTheme } from "@plane/react-theme";
import useSWR from "swr";
import { useTranslation } from "@plane/i18n";
// ui
import { Loader } from "@plane/ui";
// assets
import emptyIssueDark from "@/app/assets/empty-state/search/issues-dark.webp?url";
import emptyIssueLight from "@/app/assets/empty-state/search/issues-light.webp?url";
// components
import { EmptyState } from "@/components/common/empty-state";
import { PageHead } from "@/components/core/page-title";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useAppRouter } from "@/hooks/use-app-router";
// Plane-web
import { InitiativeDetailRoot } from "@/components/initiatives/details/root";
import { useFlag, useWorkspaceFeatures } from "@/plane-web/hooks/store";
import { useProjectAdvanced } from "@/plane-web/hooks/store/projects/use-projects";
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
import { EWorkspaceFeatures } from "@/types/workspace-feature";
import type { Route } from "./+types/page";

function InitiativeDetailsPage({ params }: Route.ComponentProps) {
  // router
  const router = useAppRouter();
  const { workspaceSlug, initiativeId } = params;

  // hooks
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();

  // store hooks
  const { fetchProjectAnalyticsCount } = useProject();
  const { fetchProjectAttributes } = useProjectAdvanced();
  const {
    initiative: { getInitiativeById, fetchInitiativeDetails },
  } = useInitiatives();
  const { isWorkspaceFeatureEnabled } = useWorkspaceFeatures();

  // fetching issue details
  const { isLoading, error } = useSWR(`INITIATIVE_DETAIL_${workspaceSlug}_${initiativeId}`, () =>
    fetchInitiativeDetails(workspaceSlug, initiativeId)
  );

  // derived values
  const initiativeDetails = getInitiativeById(initiativeId);
  const loader = !initiativeDetails || isLoading;
  const pageTitle = initiativeDetails ? `Initiative - ${initiativeDetails.name}` : "Initiative";
  const isProjectGroupingFeatureFlagEnabled = useFlag(workspaceSlug, "PROJECT_GROUPING");
  const isProjectGroupingEnabled =
    isWorkspaceFeatureEnabled(workspaceSlug, EWorkspaceFeatures.IS_PROJECT_GROUPING_ENABLED) &&
    isProjectGroupingFeatureFlagEnabled;

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
    isProjectGroupingEnabled && initiativeDetails?.project_ids && initiativeDetails?.project_ids.length > 0
      ? ["initiativeProjectAttributes", workspaceSlug, isProjectGroupingEnabled, ...initiativeDetails?.project_ids]
      : null,
    isProjectGroupingEnabled && initiativeDetails?.project_ids && initiativeDetails?.project_ids.length > 0
      ? () =>
          fetchProjectAttributes(workspaceSlug, {
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
            text: t("initiatives.empty_state.not_found.primary_button.text"),
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
        <InitiativeDetailRoot workspaceSlug={workspaceSlug} initiativeId={initiativeId} />
      )}
    </>
  );
}

export default observer(InitiativeDetailsPage);
