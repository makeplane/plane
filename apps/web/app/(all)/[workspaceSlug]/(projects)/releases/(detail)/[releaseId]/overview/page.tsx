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
import { useTheme } from "next-themes";
import { useParams } from "react-router";
import useSWR from "swr";
import { useTranslation } from "@plane/i18n";
import { Loader } from "@plane/ui";
import emptyIssueDark from "@/app/assets/empty-state/search/issues-dark.webp?url";
import emptyIssueLight from "@/app/assets/empty-state/search/issues-light.webp?url";
import { EmptyState } from "@/components/common/empty-state";
import { PageHead } from "@/components/core/page-title";
import { ReleaseDetailRoot } from "@/components/releases/detail/detail-root";
import { useAppRouter } from "@/hooks/use-app-router";
import { useReleases } from "@/hooks/store/use-releases";

function ReleaseOverviewPage() {
  const router = useAppRouter();
  const { workspaceSlug, releaseId } = useParams<{ workspaceSlug: string; releaseId: string }>();
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();
  const { release: releaseStore } = useReleases();

  const { data, isLoading, error } = useSWR(
    workspaceSlug && releaseId ? `RELEASE_DETAIL_${workspaceSlug}_${releaseId}` : null,
    workspaceSlug && releaseId ? () => releaseStore.fetchReleaseDetails(workspaceSlug, releaseId) : null
  );

  const release = releaseId ? releaseStore.getReleaseById(releaseId) : undefined;
  const loader = !release && isLoading;
  const pageTitle = release ? `Release - ${release.name}` : "Release";

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
        <Loader className="flex h-full gap-5 p-5">
          <div className="basis-2/3 space-y-2">
            <Loader.Item height="30px" width="40%" />
            <Loader.Item height="15px" width="60%" />
            <Loader.Item height="15px" width="40%" />
          </div>
        </Loader>
      </>
    );
  }

  if (!workspaceSlug || !releaseId) return null;
  if (!release && !isLoading) return null;

  return (
    <>
      <PageHead title={pageTitle} />
      <ReleaseDetailRoot workspaceSlug={workspaceSlug} releaseId={releaseId} />
    </>
  );
}

export default observer(ReleaseOverviewPage);
