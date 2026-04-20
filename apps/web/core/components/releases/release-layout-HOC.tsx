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

import { lazy, Suspense } from "react";
import useSWR from "swr";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { useTranslation } from "@plane/i18n";
import { EmptyStateDetailed } from "@plane/propel/empty-state";
import { WORKSPACE_RELEASES } from "@/constants/fetch-keys";
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useReleases } from "@/hooks/store/use-releases";

const ListLayoutLoader = lazy(() =>
  import("@/components/ui/loader/layouts/list-layout-loader").then((module) => ({
    default: module.ListLayoutLoader,
  }))
);

interface Props {
  children: string | React.ReactNode | React.ReactNode[];
}

export const ReleaseLayoutHOC = observer(function ReleaseLayoutHOC(props: Props) {
  const { workspaceSlug } = useParams();
  const { t } = useTranslation();
  const { release: releaseStore } = useReleases();
  const { toggleCreateReleaseModal } = useCommandPalette();
  const currentWorkspaceSlug = workspaceSlug?.toString();

  const { isLoading } = useSWR(
    currentWorkspaceSlug ? WORKSPACE_RELEASES(currentWorkspaceSlug) : null,
    currentWorkspaceSlug ? () => releaseStore.fetchReleases(currentWorkspaceSlug) : null
  );

  if (isLoading) {
    return (
      <Suspense>
        <ListLayoutLoader />
      </Suspense>
    );
  }

  if (releaseStore.releasesMap.size === 0) {
    return (
      <EmptyStateDetailed
        assetKey="project"
        title={t("No releases yet")}
        description={t("Manage project deliverables with precision using Releases.")}
        actions={[
          {
            label: t("Create Release"),
            onClick: () => toggleCreateReleaseModal({ isOpen: true, releaseId: undefined }),
            disabled: !currentWorkspaceSlug || !releaseStore.getCanCreate(currentWorkspaceSlug),
          },
        ]}
      />
    );
  }

  return <>{props.children}</>;
});
