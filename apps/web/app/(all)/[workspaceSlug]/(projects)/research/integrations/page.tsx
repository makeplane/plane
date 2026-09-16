/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useParams } from "react-router";
// components
import { ResearchPageShell } from "@/components/research/common/research-page-shell";
import { IntegrationSettings } from "@/components/research/integrations/integration-settings";

function WorkspaceResearchIntegrationsPage() {
  const { workspaceSlug } = useParams();
  if (!workspaceSlug) return null;

  return (
    <ResearchPageShell
      titleKey="research.nav.integrations"
      descriptionKey="research.integrations.description"
      section="integrations"
      navKey="integrations"
      adminOnly
    >
      <IntegrationSettings workspaceSlug={workspaceSlug} />
    </ResearchPageShell>
  );
}

export default observer(WorkspaceResearchIntegrationsPage);
