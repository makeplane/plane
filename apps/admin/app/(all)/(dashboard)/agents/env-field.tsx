/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Button } from "@makeplane/propel/components/button";
import { InputField } from "@makeplane/propel/components/input-field";
import type { TAgentEnvField } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
// local imports
import type { TEnvValueState } from "./form-state";

type Props = {
  field: TAgentEnvField;
  entry: TEnvValueState;
  error?: string;
  onChange: (entry: TEnvValueState) => void;
};

/**
 * An env variable. A saved secret is never shown: the field stays empty (placeholder "Keep saved
 * value") and only a typed value replaces it. Remove drops it on save. A plain setting shows its
 * saved value and is edited in place.
 */
export function AgentEnvField({ field, entry, error, onChange }: Props) {
  const { t } = useTranslation();
  const label = t(`agents.admin.form.env.${field.key}.label`);
  const help = t(`agents.admin.form.env.${field.key}.help`);

  // A plain setting shows its saved value; clearing it removes it, so it needs no keep/remove UI.
  const masked = entry.saved && !entry.plain;

  if (masked && entry.remove) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-md border border-subtle px-3 py-2">
        <div className="flex flex-col">
          <span className="text-body-xs-medium text-primary">{label}</span>
          <span className="text-caption-md-regular text-danger-primary">{t("agents.admin.form.removed")}</span>
        </div>
        <Button
          variant="secondary"
          size="sm"
          stretch="auto"
          label={t("agents.admin.form.undo_remove")}
          onClick={() => onChange({ ...entry, remove: false })}
        />
      </div>
    );
  }

  return (
    <div className="flex items-end gap-2">
      <div className="min-w-0 flex-1">
        <InputField
          id={`agent-env-${field.key}`}
          name={field.key}
          type={field.secret ? "password" : "text"}
          size="lg"
          orientation="vertical"
          label={label}
          description={masked ? `${t("agents.admin.form.saved")} · ${help}` : help}
          {...(error ? { error } : {})}
          value={entry.value}
          placeholder={masked ? t("agents.admin.form.keep") : ""}
          autoComplete="off"
          spellCheck={false}
          onChange={(event) => onChange({ ...entry, value: event.target.value })}
        />
      </div>
      {masked && (
        <Button
          variant="ghost"
          size="md"
          stretch="auto"
          label={t("agents.admin.form.remove")}
          aria-label={`${t("agents.admin.form.remove")}: ${label}`}
          onClick={() => onChange({ ...entry, value: "", remove: true })}
        />
      )}
    </div>
  );
}
