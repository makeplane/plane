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

import { useCallback } from "react";
import { observer } from "mobx-react";
import type { JSONContent } from "@plane/types";
import { SectionWrapper } from "@/components/common/layout/main/common/section-wrapper";
import { MainWrapper } from "@/components/common/layout/main/main-wrapper";
import { useAppTheme } from "@/hooks/store/use-app-theme";
import { useReleases } from "@/hooks/store/use-releases";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { useTranslation } from "@plane/i18n";
import { ReleaseOverviewDescription } from "./overview-description";
import { ReleaseOverviewProgress } from "./overview-progress";
import { ReleaseOverviewProperties } from "./overview-properties";

type ReleaseDetailRootProps = {
  workspaceSlug: string;
  releaseId: string;
};

export const ReleaseDetailRoot = observer(function ReleaseDetailRoot(props: ReleaseDetailRootProps) {
  const { workspaceSlug, releaseId } = props;
  const { t } = useTranslation();
  const { release: releaseStore } = useReleases();
  const { initiativesSidebarCollapsed } = useAppTheme();

  const release = releaseStore.getReleaseById(releaseId);
  const isEditable = releaseStore.permissions.canEdit;

  const handleDescriptionUpdate = useCallback(
    async (descriptionHtml: string, descriptionJson?: JSONContent) => {
      try {
        await releaseStore.updateRelease(workspaceSlug, releaseId, {
          description_html: descriptionHtml,
          description_json: descriptionJson,
        });
      } catch {
        setToast({ type: TOAST_TYPE.ERROR, title: t("error.something_went_wrong") });
      }
    },
    [releaseStore, workspaceSlug, releaseId, t]
  );

  if (!release) return null;

  return (
    <MainWrapper isSidebarOpen={!initiativesSidebarCollapsed} className="max-w-auto">
      <SectionWrapper className="first:pt-0 border-0">
        <h1 className="text-h1-semibold text-primary">{release.name}</h1>
      </SectionWrapper>
      <ReleaseOverviewProperties release={release} workspaceSlug={workspaceSlug} disabled={!isEditable} />
      <ReleaseOverviewDescription
        release={release}
        workspaceSlug={workspaceSlug}
        disabled={!isEditable}
        onUpdate={handleDescriptionUpdate}
      />
      <ReleaseOverviewProgress release={release} />
    </MainWrapper>
  );
});
