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
// plane imports
import { EHeaderVariant, Header } from "@plane/ui";
// components
import { WorkspaceArchivesTabList } from "@/components/archives/workspace-archives-tab-list";
import { InitiativesFiltersToggle } from "@/components/initiatives/components/rich-filters/toggle";
import { HeaderFilters } from "@/components/initiatives/header/filters";

export const ArchivedInitiativesHeader = observer(function ArchivedInitiativesHeader(props: { workspaceSlug: string }) {
  const { workspaceSlug } = props;

  if (!workspaceSlug) return null;
  return (
    <Header variant={EHeaderVariant.SECONDARY}>
      <Header.LeftItem>
        <WorkspaceArchivesTabList workspaceSlug={workspaceSlug} />
      </Header.LeftItem>
      <Header.RightItem className="flex items-center gap-2">
        <InitiativesFiltersToggle />
        <HeaderFilters workspaceSlug={workspaceSlug} isArchived />
      </Header.RightItem>
    </Header>
  );
});
