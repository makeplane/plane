/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useParams } from "react-router";
// components
import { ResearchPageShell } from "@/components/research/common/research-page-shell";
import { ResearchPlatformSettingsForm } from "@/components/research/settings/platform/platform-settings-form";

function WorkspaceResearchPlatformSettingsPage() {
  const { workspaceSlug } = useParams();
  if (!workspaceSlug) return null;

  return (
    <ResearchPageShell
      titleKey="research.nav.platform"
      descriptionKey="research.platform.description"
      section="org"
      navKey="platform"
      adminOnly
      allowDisabled
    >
      <ResearchPlatformSettingsForm workspaceSlug={workspaceSlug} />
    </ResearchPageShell>
  );
}

export default observer(WorkspaceResearchPlatformSettingsPage);
