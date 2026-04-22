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
// assets
import emptyIssueDark from "@/app/assets/empty-state/search/issues-dark.webp?url";
import emptyIssueLight from "@/app/assets/empty-state/search/issues-light.webp?url";
// components
import { EmptyState } from "@/components/common/empty-state";
import { PageHead } from "@/components/core/page-title";
import { ListLayoutLoader } from "@/components/ui/loader/layouts/list-layout-loader";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useAppRouter } from "@/hooks/use-app-router";
import { InitiativeScopeRoot } from "@/components/initiatives/scope/root";
// Plane-web
import { useFlag, useWorkspaceFeatures } from "@/plane-web/hooks/store";
import { useProjectAdvanced } from "@/plane-web/hooks/store/projects/use-projects";
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
import { EWorkspaceFeatures } from "@/types/workspace-feature";
import type { Route } from "./+types/page";

function InitiativeScopePage({ params }: Route.ComponentProps) {
  // router
  const router = useAppRouter();
  const { workspaceSlug, initiativeId } = params;

  // hooks
  const { resolvedTheme } = useTheme();
  // store hooks
  const { fetchProjectAnalyticsCount } = useProject();
  const { fetchProjectAttributes } = useProjectAdvanced();
  const {
    initiative: {
      getInitiativeById,
      fetchInitiativeDetails,
      scope: {
        epics: { fetchInitiativeEpicsDetail },
      },
    },
  } = useInitiatives();

  const { t } = useTranslation();

  const { isWorkspaceFeatureEnabled } = useWorkspaceFeatures();
  // fetching issue details
  const { isLoading, error } = useSWR(`INITIATIVE_DETAIL_${workspaceSlug}_${initiativeId}`, () =>
    fetchInitiativeDetails(workspaceSlug, initiativeId)
  );

  // fetch initiative epics
  const { isLoading: isEpicsLoading } = useSWR(`INITIATIVE_EPICS_${workspaceSlug}_${initiativeId}`, () =>
    fetchInitiativeEpicsDetail(workspaceSlug, initiativeId)
  );

  // derived values
  const initiativeDetails = getInitiativeById(initiativeId);
  const loader = !initiativeDetails || isLoading || isEpicsLoading;
  const pageTitle = initiativeDetails ? `Initiative - ${initiativeDetails.name} | Scope` : "Initiative | Scope";
  const isProjectGroupingFeatureFlagEnabled = useFlag(workspaceSlug, "PROJECT_GROUPING");
  const isProjectGroupingEnabled =
    isWorkspaceFeatureEnabled(workspaceSlug, EWorkspaceFeatures.IS_PROJECT_GROUPING_ENABLED) &&
    isProjectGroupingFeatureFlagEnabled;
  // fetch initiative project analytics count
  useSWR(
    initiativeDetails?.project_ids && initiativeDetails?.project_ids.length > 0
      ? ["initiativeProjectAnalyticsCount", workspaceSlug, ...initiativeDetails?.project_ids]
      : null,
    initiativeDetails?.project_ids && initiativeDetails?.project_ids.length > 0
      ? () =>
          fetchProjectAnalyticsCount(workspaceSlug, {
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
        <ListLayoutLoader />
      ) : (
        initiativeDetails && <InitiativeScopeRoot workspaceSlug={workspaceSlug} initiativeId={initiativeId} />
      )}
    </>
  );
}

export default observer(InitiativeScopePage);
