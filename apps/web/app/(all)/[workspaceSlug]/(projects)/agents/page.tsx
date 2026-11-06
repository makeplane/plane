/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { useTranslation } from "@plane/i18n";
// components
import { AgentChatRoot } from "@/components/agents/root";
import { PageHead } from "@/components/core/page-title";

const WorkspaceAgentsPage = observer(function WorkspaceAgentsPage() {
  const { workspaceSlug } = useParams();
  const { t } = useTranslation();
  const slug = workspaceSlug?.toString();

  return (
    <>
      <PageHead title={t("agents.title")} />
      <div className="relative h-full w-full overflow-hidden">{slug && <AgentChatRoot workspaceSlug={slug} />}</div>
    </>
  );
});

export default WorkspaceAgentsPage;
