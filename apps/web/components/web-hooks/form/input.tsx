/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Field } from "@makeplane/propel/components/field";
import { Input, InputGroup } from "@makeplane/propel/components/input";
import { useTranslation } from "@plane/i18n";

type Props = {
  value: string;
  onChange: (value: string) => void;
  hasError: boolean;
};
export function WebhookInput(props: Props) {
  const { value, onChange, hasError } = props;
  const { t } = useTranslation();

  return (
    <>
      <h6 className="text-13 font-medium">{t("workspace_settings.settings.webhooks.modal.payload")}</h6>
      <Field name="payload" invalid={hasError}>
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
      </Field>
    </>
  );
}
