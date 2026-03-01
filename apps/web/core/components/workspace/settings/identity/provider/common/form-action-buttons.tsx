/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

// plane imports
import { Button } from "@plane/propel/button";
import { Tooltip } from "@plane/propel/tooltip";

type TProviderFormActionButton = {
  isEnabled: boolean;
  isSubmitButtonDisabled: boolean;
  isSubmitting: boolean;
  onSubmit: (enableProvider: boolean) => Promise<void>;
  submitType: "configure-and-enable" | "default" | null;
  t: (key: string) => string;
  tooltipContentI18nKey?: string;
};

export function ProviderFormActionButtons(props: TProviderFormActionButton) {
  const { isEnabled, isSubmitButtonDisabled, isSubmitting, onSubmit, submitType, t, tooltipContentI18nKey } = props;

  if (isEnabled) {
    return (
      <div className="flex items-center gap-2 pt-2">
        <ActionButtonTooltipWrapper content={tooltipContentI18nKey ? t(tooltipContentI18nKey) : undefined}>
          <Button
            variant="primary"
            size="lg"
            type="button"
            loading={isSubmitting}
            disabled={isSubmitButtonDisabled}
            onClick={() => void onSubmit(false)}
          >
            {submitType === "default"
              ? t("sso.providers.form_action_buttons.saving")
              : t("sso.providers.form_action_buttons.save_changes")}
          </Button>
        </ActionButtonTooltipWrapper>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 pt-2">
      <ActionButtonTooltipWrapper content={tooltipContentI18nKey ? t(tooltipContentI18nKey) : undefined}>
        <Button
          variant="primary"
          size="lg"
          type="button"
          loading={isSubmitting}
          disabled={isSubmitButtonDisabled}
          onClick={() => void onSubmit(true)}
        >
          {submitType === "configure-and-enable"
            ? t("sso.providers.form_action_buttons.saving")
            : t("sso.providers.form_action_buttons.configure_and_enable")}
        </Button>
      </ActionButtonTooltipWrapper>
      <ActionButtonTooltipWrapper content={tooltipContentI18nKey ? t(tooltipContentI18nKey) : undefined}>
        <Button
          variant="secondary"
          size="lg"
          type="button"
          loading={isSubmitting}
          disabled={isSubmitButtonDisabled}
          onClick={() => void onSubmit(false)}
        >
          {submitType === "default"
            ? t("sso.providers.form_action_buttons.saving")
            : t("sso.providers.form_action_buttons.configure_only")}
        </Button>
      </ActionButtonTooltipWrapper>
    </div>
  );
}

function ActionButtonTooltipWrapper({ content, children }: { content?: string; children: React.ReactNode }) {
  if (!content) {
    return children;
  }

  return (
    <Tooltip tooltipContent={content} disabled={!content} position="bottom">
      <div>{children}</div>
    </Tooltip>
  );
}
