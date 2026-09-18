/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useParams } from "react-router";
// components
import { ResearchAuditEventTable } from "@/components/research/audit/audit-event-table";
import { ResearchPageShell } from "@/components/research/common/research-page-shell";

function WorkspaceResearchAuditPage() {
  const { workspaceSlug } = useParams();
  if (!workspaceSlug) return null;

  return (
    <ResearchPageShell
      titleKey="research.nav.audit"
      descriptionKey="research.audit.description"
      section="org"
      navKey="audit"
      adminOnly
      allowDisabled
    >
      <ResearchAuditEventTable workspaceSlug={workspaceSlug} />
    </ResearchPageShell>
  );
}

export default observer(WorkspaceResearchAuditPage);
