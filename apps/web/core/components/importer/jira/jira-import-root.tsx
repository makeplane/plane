/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { mutate } from "swr";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
// constants
import { JIRA_IMPORT_JOBS_LIST } from "@/constants/fetch-keys";
// local imports
import { JiraImportWizard } from "./jira-import-wizard";
import { PrevImports } from "./prev-imports";

type Props = { workspaceSlug: string };

export const JiraImportRoot = observer(function JiraImportRoot({ workspaceSlug }: Props) {
  const { t } = useTranslation();
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex items-center justify-between rounded-lg border border-subtle bg-surface-1 p-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-md bg-layer-1">
            <JiraGlyph />
          </div>
          <div>
            <p className="text-14 font-medium text-secondary">{t("workspace_settings.settings.imports.jira.title")}</p>
            <p className="text-12 text-tertiary">{t("workspace_settings.settings.imports.jira.description")}</p>
          </div>
        </div>
        <Button variant="primary" onClick={() => setIsWizardOpen(true)}>
          {t("workspace_settings.settings.imports.jira.cta")}
        </Button>
      </div>

      <div>
        <h3 className="mb-2 text-14 font-medium text-secondary">
          {t("workspace_settings.settings.imports.previous_imports")}
        </h3>
        <PrevImports workspaceSlug={workspaceSlug} />
      </div>

      <JiraImportWizard
        workspaceSlug={workspaceSlug}
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onCreated={() => mutate(JIRA_IMPORT_JOBS_LIST(workspaceSlug))}
      />
    </div>
  );
});

function JiraGlyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M28.5 15.3 16.7 3.5 15.5 2.3l-8.9 8.9-4.1 4.1a1.1 1.1 0 0 0 0 1.5l8.2 8.2 1.2 1.2 8.9-8.9.1-.1 6.6-6.6a1 1 0 0 0 0-1.5ZM15.5 19.6 11.4 15.5l4.1-4.1 4.1 4.1-4.1 4.1Z"
        fill="#2684FF"
      />
    </svg>
  );
}
