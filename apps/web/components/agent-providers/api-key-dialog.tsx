/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
// plane imports
import { Button } from "@makeplane/propel/components/button";
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogHeading,
  DialogMain,
  DialogTitle,
} from "@makeplane/propel/components/dialog";
import { InputField } from "@makeplane/propel/components/input-field";
import { setToast } from "@plane/blocks/toast";
import { useTranslation } from "@plane/i18n";
import type { TAgentProviderCredentialScope } from "@plane/services";
import type { TAgentProvider, TAgentProviderEntry } from "@plane/types";
// local imports
import { AGENT_PROVIDER_NAMES, apiErrorMessage, normalizeApiKey } from "./helpers";

type Props = {
  provider: TAgentProvider;
  scope: TAgentProviderCredentialScope;
  /** A key is already set; the dialog replaces it. */
  replace: boolean;
  /** Saves the key and returns the updated provider entry. */
  onSubmit: (apiKey: string) => Promise<TAgentProviderEntry>;
  onClose: () => void;
  onSaved: (entry: TAgentProviderEntry) => void;
};

/** Adds or replaces an API key. The key is write-only: it is never shown again after saving. */
export function AgentProviderApiKeyDialog({ provider, scope, replace, onSubmit, onClose, onSaved }: Props) {
  const { t } = useTranslation();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const vendor = AGENT_PROVIDER_NAMES[provider].vendor;
  const titleKey = `agents.providers.api_key_dialog.${scope}.${replace ? "title_replace" : "title_add"}`;

  const handleSubmit = async () => {
    const apiKey = normalizeApiKey(value);
    if (!apiKey) {
      setError(t("agents.providers.api_key_dialog.invalid"));
      return;
    }
    setError(undefined);
    setIsSubmitting(true);
    try {
      const entry = await onSubmit(apiKey);
      setToast({ type: "success", title: t("agents.providers.toasts.key_saved") });
      onSaved(entry);
    } catch (caught) {
      const message = apiErrorMessage(caught);
      if (message) setError(message);
      setToast({
        type: "error",
        title: t("agents.providers.toasts.error_title"),
        message: message ?? t("agents.providers.toasts.key_save_failed"),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !isSubmitting) onClose();
      }}
    >
      <DialogContent size="md">
        <DialogMain>
          <DialogHeader>
            <DialogHeading>
              <DialogTitle>{t(titleKey, { provider: vendor })}</DialogTitle>
              <DialogDescription>{t(`agents.providers.api_key_dialog.${scope}.description`)}</DialogDescription>
            </DialogHeading>
          </DialogHeader>
          <DialogBody>
            <form
              id="agent-provider-api-key-form"
              noValidate
              onSubmit={(event) => {
                event.preventDefault();
                void handleSubmit();
              }}
            >
              <InputField
                id="agent-provider-api-key"
                name="api_key"
                type="password"
                size="lg"
                orientation="vertical"
                label={t("agents.providers.api_key_dialog.label", { provider: vendor })}
                required
                autoComplete="off"
                spellCheck={false}
                value={value}
                {...(error ? { error } : {})}
                onChange={(event) => setValue(event.target.value)}
              />
            </form>
          </DialogBody>
        </DialogMain>
        <DialogActions>
          <Button
            variant="secondary"
            size="md"
            stretch="auto"
            label={t("agents.providers.cancel")}
            disabled={isSubmitting}
            onClick={onClose}
          />
          <Button
            type="submit"
            form="agent-provider-api-key-form"
            variant="primary"
            size="md"
            stretch="auto"
            loading={isSubmitting}
            label={t(isSubmitting ? "agents.providers.api_key_dialog.saving" : "agents.providers.api_key_dialog.save")}
          />
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
}
