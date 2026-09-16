/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useParams } from "react-router";
// plane imports
import { useTranslation } from "@plane/i18n";
// components
import { ResearchPageShell } from "@/components/research/common/research-page-shell";
import { ResearchAdminRoleSummary } from "@/components/research/settings/system/admin-role-summary";
import { ResearchInviteCodeManager } from "@/components/research/settings/system/invite-code-manager";
import { ResearchUserImportPanel } from "@/components/research/settings/system/user-import-panel";

/**
 * Account lifecycle: invite codes and the roster import
 * (SYS-ACC-01 ~ SYS-ACC-12).
 */
function WorkspaceResearchSystemSettingsPage() {
  const { workspaceSlug } = useParams();
  const { t } = useTranslation();
  if (!workspaceSlug) return null;

  return (
    <ResearchPageShell
      titleKey="research.nav.system"
      descriptionKey="research.system.description"
      section="org"
      navKey="system"
      adminOnly
    >
      <div className="flex h-full flex-col gap-6 overflow-y-auto p-5">
        <ResearchAdminRoleSummary />
        <section className="flex flex-col gap-3">
          <h3 className="text-13 font-medium text-primary">{t("research.invite_codes.title")}</h3>
          <ResearchInviteCodeManager workspaceSlug={workspaceSlug} />
        </section>
        <section className="flex flex-col gap-3">
          <h3 className="text-13 font-medium text-primary">{t("research.user_import.title")}</h3>
          <ResearchUserImportPanel workspaceSlug={workspaceSlug} />
        </section>
      </div>
    </ResearchPageShell>
  );
}

export default observer(WorkspaceResearchSystemSettingsPage);
