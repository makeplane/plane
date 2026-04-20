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
import { useTranslation } from "@plane/i18n";
import { EmptyStateDetailed } from "@plane/propel/empty-state";
import { useReleases } from "@/hooks/store/use-releases";

export const ReleaseEmptyState = observer(function ReleaseEmptyState() {
  const { releaseId: routerReleaseId } = useParams();
  const releaseId = routerReleaseId?.toString();
  const { t } = useTranslation();
  const { release: releaseStore } = useReleases();
  const release = releaseId ? releaseStore.getReleaseById(releaseId) : undefined;

  return (
    <div className="relative h-full w-full overflow-y-auto">
      <div className="grid h-full w-full place-items-center">
        <EmptyStateDetailed
          assetKey="work-item"
          title={t("releases.empty_state.title")}
          description={t("releases.empty_state.description")}
          actions={
            release?.canEdit && releaseId
              ? [
                  {
                    label: t("releases.empty_state.add_scope"),
                    onClick: () => releaseStore.openAddWorkItemsModal(releaseId),
                    variant: "primary",
                  },
                ]
              : []
          }
        />
      </div>
    </div>
  );
});
