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

import { useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { DEFAULT_GLOBAL_VIEWS_LIST } from "@plane/constants";
// components
import { PageHead } from "@/components/core/page-title";
import { AllIssueLayoutRoot } from "@/components/issues/issue-layouts/roots/all-issue-layout-root";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
import type { Route } from "./+types/page";

function GlobalViewIssuesPage({ params }: Route.ComponentProps) {
  // router
  const { globalViewId } = params;
  // store hooks
  const { currentWorkspace } = useWorkspace();

  // derived values
  const defaultView = DEFAULT_GLOBAL_VIEWS_LIST.find((view) => view.key === globalViewId);
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace?.name} - All Views` : undefined;

  // handlers
  return (
    <>
      <PageHead title={pageTitle} />
      <AllIssueLayoutRoot isDefaultView={!!defaultView} />
    </>
  );
}

export default observer(GlobalViewIssuesPage);
