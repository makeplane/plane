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
import { useParams, useNavigate } from "react-router";
import { useTranslation } from "@plane/i18n";
import { ReleaseIcon } from "@plane/propel/icons";
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
import { Breadcrumbs, Header } from "@plane/ui";
import { useReleases } from "@/hooks/store/use-releases";

/**
 * Top header breadcrumb for release detail: "Releases > [current-release]".
 * Used in the releases layout when viewing a release.
 */
export const ReleaseDetailBreadcrumbHeader = observer(function ReleaseDetailBreadcrumbHeader() {
  const { workspaceSlug, releaseId } = useParams<{ workspaceSlug: string; releaseId: string }>();
  const navigate = useNavigate();
  const { release: releaseStore } = useReleases();
  const { t } = useTranslation();

  const release = releaseId ? releaseStore.getReleaseById(releaseId) : undefined;

  if (!workspaceSlug || !releaseId) return null;

  const basePath = `/${workspaceSlug}/releases/${releaseId}`;

  return (
    <Header>
      <Header.LeftItem>
        <Breadcrumbs onBack={() => navigate(-1)}>
          <Breadcrumbs.Item
            component={
              <BreadcrumbLink
                label={t("releases.label", { count: 2 })}
                href={`/${workspaceSlug}/releases`}
                icon={<ReleaseIcon className="size-4" />}
              />
            }
          />
          <Breadcrumbs.Item
            component={<BreadcrumbLink label={release?.name ?? releaseId} href={basePath} />}
            showSeparator={false}
          />
        </Breadcrumbs>
      </Header.LeftItem>
    </Header>
  );
});
