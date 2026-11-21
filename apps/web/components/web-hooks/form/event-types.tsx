/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useId } from "react";
import { Radio, RadioGroup, RadioIndicator } from "@makeplane/propel/elements/radio";
// types
import { useTranslation } from "@plane/i18n";
import type { TWebhookEventTypes } from "@plane/types";

type Props = {
  value: string;
  onChange: (value: TWebhookEventTypes) => void;
};

const WEBHOOK_EVENT_TYPES: { key: TWebhookEventTypes; i18n_label: string }[] = [
  {
    key: "all",
    i18n_label: "workspace_settings.settings.webhooks.options.all",
  },
  {
    key: "individual",
    i18n_label: "workspace_settings.settings.webhooks.options.individual",
  },
];

export function WebhookOptions(props: Props) {
  const { value, onChange } = props;
  const { t } = useTranslation();
  const questionId = useId();

  return (
    <>
      <h6 id={questionId} className="text-body-xs-medium">
        {t("workspace_settings.settings.webhooks.modal.question")}
      </h6>
      <RadioGroup density="comfortable" role="radiogroup" aria-labelledby={questionId}>
        {WEBHOOK_EVENT_TYPES.map((option) => (
          <div key={option.key} className="flex items-center gap-2">
            <span className="relative flex shrink-0 items-center justify-center">
              <Radio
                data-checked={value === option.key ? "" : undefined}
                render={
                  <input
                    id={option.key}
                    type="radio"
                    name="webhook-event-type"
                    value={option.key}
                    checked={value == option.key}
                    onChange={() => onChange(option.key)}
                    className="cursor-pointer appearance-none"
                  />
                }
              />
              {value === option.key && (
                <RadioIndicator
                  aria-hidden="true"
                  render={<span className="pointer-events-none absolute text-icon-accent-primary" />}
                />
              )}
            </span>
            <label className="cursor-pointer text-body-xs-regular" htmlFor={option.key}>
              {t(option.i18n_label)}
            </label>
          </div>
        ))}
      </RadioGroup>
    </>
  );
}
