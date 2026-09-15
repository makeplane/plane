/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useParams } from "react-router";
// components
import { ResearchApprovalList } from "@/components/research/approvals/approval-list";
import { ResearchPageShell } from "@/components/research/common/research-page-shell";
// hooks
import { useResearch } from "@/hooks/store/use-research";

function WorkspaceResearchApprovalsPage() {
  const { workspaceSlug } = useParams();
  const research = useResearch();
  if (!workspaceSlug) return null;

  return (
    <ResearchPageShell
      titleKey="research.nav.approvals"
      descriptionKey="research.approvals.description"
      section="approvals"
    >
      <ResearchApprovalList workspaceSlug={workspaceSlug} isAdmin={research.isWorkspaceAdmin} />
    </ResearchPageShell>
  );
}

export default observer(WorkspaceResearchApprovalsPage);
