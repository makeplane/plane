/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
// components
import { PageHead } from "@/components/core/page-title";
import { TimeTrackingRoot } from "@/components/team-ops/time";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
import type { Route } from "./+types/page";

function TimeTrackingPage({ params }: Route.ComponentProps) {
  const { workspaceSlug } = params;
  // hooks
  const { t } = useTranslation();
  const { currentWorkspace } = useWorkspace();
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace.name} - ${t("team_ops.time.title")}` : undefined;

  return (
    <>
      <PageHead title={pageTitle} />
      <TimeTrackingRoot workspaceSlug={workspaceSlug} />
    </>
  );
}

export default observer(TimeTrackingPage);
