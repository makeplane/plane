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
import { PageHead } from "@/components/core/page-title";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
// plane web components
import InitiativesFiltersRow from "@/components/initiatives/components/rich-filters/row";
import { InitiativesRoot } from "@/components/initiatives/components/initiatives-root";
import { InitiativePeekOverview } from "@/components/initiatives/peek-overview/root";
// types
import type { Route } from "./+types/page";

function InitiativesPage(props: Route.ComponentProps) {
  const { workspaceSlug } = props.params;
  // store hooks
  const { getWorkspaceBySlug } = useWorkspace();
  // derived values
  const currentWorkspace = getWorkspaceBySlug(workspaceSlug);

  // derived values
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace?.name} - Initiatives` : undefined;

  return (
    <>
      <PageHead title={pageTitle} />
      <div className="h-full w-full flex flex-col">
        <InitiativesFiltersRow />
        <InitiativesRoot workspaceSlug={workspaceSlug} />
        <InitiativePeekOverview />
      </div>
    </>
  );
}
export default observer(InitiativesPage);
