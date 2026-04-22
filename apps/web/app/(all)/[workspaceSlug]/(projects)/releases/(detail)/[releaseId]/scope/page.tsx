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
import emptyIssueDark from "@/app/assets/empty-state/search/issues-dark.webp?url";
import emptyIssueLight from "@/app/assets/empty-state/search/issues-light.webp?url";
import { EmptyState } from "@/components/common/empty-state";
import { PageHead } from "@/components/core/page-title";
import { ListLayoutLoader } from "@/components/ui/loader/layouts/list-layout-loader";
import { ReleaseScopeRoot } from "@/components/releases/scope/scope-root";
import { useAppRouter } from "@/hooks/use-app-router";
import { useReleases } from "@/hooks/store/use-releases";
import type { Route } from "./+types/page";

function ReleaseScopePage({ params }: Route.ComponentProps) {
  const router = useAppRouter();
  const { workspaceSlug, releaseId } = params;
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();
  const { release: releaseStore } = useReleases();

  const { isLoading, error } = useSWR(
    workspaceSlug && releaseId ? `RELEASE_DETAIL_${workspaceSlug}_${releaseId}` : null,
    workspaceSlug && releaseId ? () => releaseStore.fetchReleaseDetails(workspaceSlug, releaseId) : null
  );

  const releaseFromStore = releaseId ? releaseStore.getReleaseById(releaseId) : undefined;
  const loader = !releaseFromStore && isLoading;
  const pageTitle = releaseFromStore
    ? t("releases.page_title.scope", { name: releaseFromStore.name })
    : t("releases.page_title.scope_fallback");

  if (error) {
    return (
      <>
        <PageHead title={pageTitle} />
        <EmptyState
          image={resolvedTheme === "dark" ? emptyIssueDark : emptyIssueLight}
          title={t("releases.empty_state.not_found.title") ?? "Release not found"}
          description={t("releases.empty_state.not_found.description") ?? "The release may have been deleted."}
          primaryButton={{
            text: t("releases.empty_state.not_found.primary_button") ?? "Back to releases",
            onClick: () => router.push(`/${workspaceSlug}/releases`),
          }}
        />
      </>
    );
  }

  if (loader) {
    return (
      <>
        <PageHead title={pageTitle} />
        <ListLayoutLoader />
      </>
    );
  }

  if (!releaseFromStore && !isLoading) return null;

  return (
    <>
      <PageHead title={pageTitle} />
      <ReleaseScopeRoot />
    </>
  );
}

export default observer(ReleaseScopePage);
