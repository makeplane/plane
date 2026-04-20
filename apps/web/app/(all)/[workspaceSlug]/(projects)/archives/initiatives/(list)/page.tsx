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
import { ArchivedInitiativesHeader } from "@/components/archives/archived-initiatives-header";
import { PageHead } from "@/components/core/page-title";
import { InitiativesPageRoot } from "@/components/initiatives/layout/page";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";

import type { Route } from "./+types/page";

const ArchivedInitiativesPage = observer(function ArchivedInitiativesPage({ params }: Route.ComponentProps) {
  const { workspaceSlug } = params;
  // store hooks
  const { currentWorkspace } = useWorkspace();

  // derived values
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace?.name} - Archived Initiatives` : undefined;

  return (
    <>
      <PageHead title={pageTitle} />
      <div className="relative flex h-full w-full flex-col overflow-hidden">
        <ArchivedInitiativesHeader workspaceSlug={workspaceSlug} />
        <InitiativesPageRoot workspaceSlug={workspaceSlug} isArchived />
      </div>
    </>
  );
});

export default ArchivedInitiativesPage;
