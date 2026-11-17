/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { InputField } from "@makeplane/propel/components/input-field";
import { useTranslation } from "@plane/i18n";

type Props = {
  value: string;
  onChange: (value: string) => void;
  hasError: boolean;
  errorMessage?: string;
};
export function WebhookInput(props: Props) {
  const { value, onChange, hasError, errorMessage } = props;
  const { t } = useTranslation();

  return (
    <InputField
      size="lg"
      orientation="vertical"
      name="payload"
      label={t("workspace_settings.settings.webhooks.modal.payload")}
      required
      type="url"
      onChange={(e) => onChange(e.target.value)}
      value={value}
      autoComplete="off"
      placeholder="https://example.com/post"
      autoFocus
      error={hasError ? errorMessage : undefined}
    />
  );
}
