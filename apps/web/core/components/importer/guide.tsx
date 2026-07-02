/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";
import { EvaImportForm } from "./eva-import-form";
import { JiraRtmImportForm } from "./jira-rtm-import-form";
import { PrevImports } from "./prev-imports";

type ImportProvider = "eva" | "jira_rtm";

export const ImportGuide = observer(function ImportGuide() {
  const { workspaceSlug } = useParams();
  const { t } = useTranslation();
  const [provider, setProvider] = useState<ImportProvider>("eva");
  const slug = workspaceSlug?.toString() ?? "";

  return (
    <div className="flex size-full flex-col gap-y-13">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={cn(
              "rounded-md border px-3 py-2 text-body-xs-medium transition-colors",
              provider === "eva"
                ? "border-accent-strong bg-accent-primary/10 text-primary"
                : "border-subtle bg-layer-1 text-secondary hover:text-primary"
            )}
            onClick={() => setProvider("eva")}
          >
            {t("workspace_settings.settings.imports.providers.eva")}
          </button>
          <button
            type="button"
            className={cn(
              "rounded-md border px-3 py-2 text-body-xs-medium transition-colors",
              provider === "jira_rtm"
                ? "border-accent-strong bg-accent-primary/10 text-primary"
                : "border-subtle bg-layer-1 text-secondary hover:text-primary"
            )}
            onClick={() => setProvider("jira_rtm")}
          >
            {t("workspace_settings.settings.imports.providers.jira_rtm")}
          </button>
        </div>
        {provider === "eva" ? <EvaImportForm workspaceSlug={slug} /> : <JiraRtmImportForm workspaceSlug={slug} />}
      </div>
      <PrevImports workspaceSlug={slug} />
    </div>
  );
});
