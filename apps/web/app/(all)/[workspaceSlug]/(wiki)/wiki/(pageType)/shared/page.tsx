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

// plane web components
import { WithFeatureFlagHOC } from "@/components/feature-flags";
import { WikiPagesListLayoutRoot } from "@/plane-web/components/pages";
// local components
import type { Route } from "./+types/layout";
import { SharedPagesFallback } from "./empty-shared-pages";

export default function SharedPagesList({ params }: Route.ComponentProps) {
  const { workspaceSlug } = params;

  return (
    <WithFeatureFlagHOC workspaceSlug={workspaceSlug} flag="SHARED_PAGES" fallback={<SharedPagesFallback />}>
      <WikiPagesListLayoutRoot pageType="shared" />
    </WithFeatureFlagHOC>
  );
}
