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
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { PageHead } from "@/components/core/page-title";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { RelationDefinitionRoot } from "@/components/settings/workspace/relations";
import { useRelationDefinition } from "@/hooks/store/use-relation-definition";
// store hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
// local imports
import type { Route } from "./+types/page";
import { RelationsWorkspaceSettingsHeader } from "./header";

function RelationsSettingsPage({ params }: Route.ComponentProps) {
  // router
  const { workspaceSlug } = params;
  // store hooks
  const { currentWorkspace } = useWorkspace();
  const { permissions: relationDefinitionPermissions } = useRelationDefinition();

  // derived values
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace.name} - Relations` : undefined;
  const canAccess = relationDefinitionPermissions.getCanView(workspaceSlug);

  if (!currentWorkspace?.id) return <></>;

  if (!canAccess) return <NotAuthorizedView section="settings" className="h-auto" />;

  return (
    <SettingsContentWrapper header={<RelationsWorkspaceSettingsHeader />}>
      <PageHead title={pageTitle} />
      <RelationDefinitionRoot workspaceSlug={workspaceSlug} />
    </SettingsContentWrapper>
  );
}

export default observer(RelationsSettingsPage);
