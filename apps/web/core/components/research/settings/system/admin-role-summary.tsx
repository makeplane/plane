/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { ADMIN_ROLE_LABELS } from "@plane/constants";
import type { TAdminRole } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
// hooks
import { useResearch } from "@/hooks/store/use-research";

/**
 * Read-only mirror of the administrator tags.
 *
 * Tags are granted in the instance admin console (god mode); the research
 * settings page only shows what the caller holds, so nobody expects to
 * appoint administrators from here.
 */
export const ResearchAdminRoleSummary = observer(function ResearchAdminRoleSummary() {
  const { t } = useTranslation();
  const research = useResearch();
  const roles = (research.identity?.user?.admin_roles ?? []) as TAdminRole[];
  const isWorkspaceAdmin = Boolean(research.identity?.user?.is_workspace_admin);

  return (
    <div className="flex flex-col gap-2 rounded-md border border-subtle p-3">
      <h4 className="text-12 font-medium text-primary">{t("research.system.admin_roles_title")}</h4>
      <div className="flex flex-wrap gap-2">
        {roles.length === 0 ? (
          <span className="text-11 text-tertiary">{t("research.system.admin_roles_empty")}</span>
        ) : (
          roles.map((role) => (
            <span key={role} className="rounded-full border border-subtle px-2 py-0.5 text-11 text-secondary">
              {t(ADMIN_ROLE_LABELS[role])}
            </span>
          ))
        )}
        {isWorkspaceAdmin && (
          <span className="rounded-full border border-subtle px-2 py-0.5 text-11 text-secondary">
            {t("research.system.workspace_admin")}
          </span>
        )}
      </div>
      <p className="text-11 text-tertiary">{t("research.system.admin_roles_hint")}</p>
    </div>
  );
});

export default ResearchAdminRoleSummary;
