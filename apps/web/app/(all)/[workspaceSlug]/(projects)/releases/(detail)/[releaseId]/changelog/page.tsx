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
// components
import { PageHead } from "@/components/core/page-title";
import { ReleaseChangelogRoot } from "@/components/releases/changelog/changelog-root";
// hooks
import { useReleases } from "@/hooks/store/use-releases";
// local imports
import type { Route } from "./+types/page";

function ReleaseChangelogPage({ params }: Route.ComponentProps) {
  const { workspaceSlug, releaseId } = params;
  // store hooks
  const { release: releaseStore } = useReleases();
  // derived values
  const release = releaseId ? releaseStore.getReleaseById(releaseId) : undefined;
  const pageTitle = release ? `${release.name} — Changelog` : "Changelog";

  return (
    <>
      <PageHead title={pageTitle} />
      <ReleaseChangelogRoot releaseId={releaseId} workspaceSlug={workspaceSlug} />
    </>
  );
}

export default observer(ReleaseChangelogPage);
