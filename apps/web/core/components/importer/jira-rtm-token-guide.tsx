/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTranslation } from "@plane/i18n";

const RTM_TOKEN_GUIDE_STEP_KEYS = [
  "workspace_settings.settings.imports.jira_rtm.rtm_token_guide.steps.open_rtm",
  "workspace_settings.settings.imports.jira_rtm.rtm_token_guide.steps.open_menu",
  "workspace_settings.settings.imports.jira_rtm.rtm_token_guide.steps.open_auth",
  "workspace_settings.settings.imports.jira_rtm.rtm_token_guide.steps.copy_base_url",
  "workspace_settings.settings.imports.jira_rtm.rtm_token_guide.steps.generate_token",
  "workspace_settings.settings.imports.jira_rtm.rtm_token_guide.steps.select_user",
  "workspace_settings.settings.imports.jira_rtm.rtm_token_guide.steps.enter_label",
  "workspace_settings.settings.imports.jira_rtm.rtm_token_guide.steps.copy_token",
  "workspace_settings.settings.imports.jira_rtm.rtm_token_guide.steps.paste_into_plane",
] as const;

export function JiraRtmTokenGuide() {
  const { t } = useTranslation();

  return (
    <details className="rounded-lg border border-subtle bg-layer-1 p-4">
      <summary className="cursor-pointer text-body-sm-medium text-primary">
        {t("workspace_settings.settings.imports.jira_rtm.rtm_token_guide.title")}
      </summary>
      <div className="mt-3 space-y-3 text-13 text-secondary">
        <p>{t("workspace_settings.settings.imports.jira_rtm.rtm_token_guide.intro")}</p>
        <ol className="list-decimal space-y-2 pl-5">
          {RTM_TOKEN_GUIDE_STEP_KEYS.map((stepKey) => (
            <li key={stepKey}>{t(stepKey)}</li>
          ))}
        </ol>
        <p className="text-12 text-tertiary">
          {t("workspace_settings.settings.imports.jira_rtm.rtm_token_guide.note")}
        </p>
      </div>
    </details>
  );
}
