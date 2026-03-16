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
import { useParams } from "next/navigation";
import useSWR from "swr";
import { EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EmptyStateDetailed } from "@plane/propel/empty-state";
import { Loader } from "@plane/ui";
import { EUserWorkspaceRoles } from "@plane/types";
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useUserPermissions } from "@/hooks/store/user";
import releaseService from "@/services/release.service";
import { ReleasesListLayout } from "./releases-list-layout";

export const ReleasesRoot = observer(function ReleasesRoot() {
  const { workspaceSlug } = useParams();
  const { t } = useTranslation();
  const { toggleCreateReleaseModal } = useCommandPalette();
  const { allowPermissions } = useUserPermissions();

  const hasWorkspaceMemberLevelPermissions = allowPermissions(
    [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );

  const { data: releases, isLoading } = useSWR(
    workspaceSlug ? `RELEASES_${workspaceSlug}` : null,
    workspaceSlug ? () => releaseService.list(workspaceSlug.toString()) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  if (isLoading) {
    return (
      <Loader className="h-full w-full overflow-y-auto">
        {Array.from({ length: 3 }, (_, groupIndex) => (
          <div key={groupIndex}>
            <div className="flex items-center gap-2 px-6 py-2 border-b border-subtle bg-layer-2">
              <Loader.Item height="16px" width="16px" className="rounded-full flex-shrink-0" />
              <Loader.Item height="14px" width="80px" />
              <Loader.Item height="14px" width="24px" className="ml-1" />
            </div>
            {Array.from({ length: groupIndex === 0 ? 3 : 1 }, (_, rowIndex) => (
              <div
                key={rowIndex}
                className="flex w-full items-center justify-between gap-5 border-b border-subtle px-6 py-4"
              >
                <div className="flex items-center gap-3 overflow-hidden min-w-0">
                  <Loader.Item height="30px" width="30px" className="rounded-full flex-shrink-0" />
                  <Loader.Item height="16px" width={rowIndex === 0 ? "160px" : rowIndex === 1 ? "200px" : "120px"} />
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Loader.Item height="24px" width="80px" className="rounded-sm" />
                  <Loader.Item height="24px" width="60px" className="rounded-sm" />
                  <Loader.Item height="24px" width="70px" className="rounded-sm" />
                </div>
              </div>
            ))}
          </div>
        ))}
      </Loader>
    );
  }

  if (!releases || releases.length === 0) {
    return (
      <EmptyStateDetailed
        assetKey="project"
        title={t("No releases yet")}
        description={t("Manage project deliverables with precision using Releases.")}
        actions={[
          {
            label: t("Create Release"),
            onClick: () => toggleCreateReleaseModal({ isOpen: true, releaseId: undefined }),
            disabled: !hasWorkspaceMemberLevelPermissions,
          },
        ]}
      />
    );
  }

  return <ReleasesListLayout releases={releases} />;
});
