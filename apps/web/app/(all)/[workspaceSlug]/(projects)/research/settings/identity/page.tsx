/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useParams } from "react-router";
// components
import { ResearchPageShell } from "@/components/research/common/research-page-shell";
import { ResearchIdentityMappingTable } from "@/components/research/settings/identity/identity-mapping-table";

function WorkspaceResearchIdentitySettingsPage() {
  const { workspaceSlug } = useParams();
  if (!workspaceSlug) return null;

  return (
    <ResearchPageShell
      titleKey="research.nav.identity"
      descriptionKey="research.identity.description"
      section="org"
      adminOnly
    >
      <ResearchIdentityMappingTable workspaceSlug={workspaceSlug} />
    </ResearchPageShell>
  );
}

export default observer(WorkspaceResearchIdentitySettingsPage);
