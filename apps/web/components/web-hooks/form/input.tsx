/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Field, FieldError, FieldLabel } from "@makeplane/propel/components/field";
import { Input, InputGroup } from "@makeplane/propel/components/input";
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
    <Field name="payload" invalid={hasError}>
      <FieldLabel size="2xl" inset={false}>
        {t("workspace_settings.settings.webhooks.modal.payload")}
      </FieldLabel>
      <InputGroup size="2xl">
        <Input
          size="2xl"
          type="url"
          onChange={(e) => onChange(e.target.value)}
          value={value}
          autoComplete="off"
          placeholder="https://example.com/post"
          autoFocus
          aria-label={t("workspace_settings.settings.webhooks.modal.payload")}
        />
      </InputGroup>
      {errorMessage && (
        <FieldError size="2xl" match={hasError}>
          {errorMessage}
        </FieldError>
      )}
    </Field>
  );
}
