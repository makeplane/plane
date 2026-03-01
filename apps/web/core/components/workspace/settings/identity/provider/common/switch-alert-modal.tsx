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

import { useState } from "react";
import type { TProviderType } from "@plane/types";
import { AlertModalCore } from "@plane/ui";
import { getSSOProviderName } from "@plane/utils";
import { useTranslation } from "@plane/i18n";

export type TSwitchAlertModalState = {
  isOpen: boolean;
  onSubmitCallback: () => Promise<void>;
};

type TSwitchAlertModal = {
  activeProvider: TProviderType;
  handleClose: () => void;
  handleSwitch: () => Promise<void>;
  isOpen: boolean;
  newProvider: TProviderType;
};

export function SwitchAlertModal(props: TSwitchAlertModal) {
  const { activeProvider, handleClose, handleSwitch, isOpen, newProvider } = props;
  // states
  const [isSwitching, setIsSwitching] = useState(false);
  // plane hooks
  const { t } = useTranslation();
  // derived values
  const newProviderName = getSSOProviderName(newProvider);
  const activeProviderName = getSSOProviderName(activeProvider);

  const handleSubmit = async () => {
    try {
      setIsSwitching(true);
      await handleSwitch();
    } catch (error) {
      console.error("Failed to switch SSO method", error);
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <AlertModalCore
      isOpen={isOpen}
      variant="primary"
      handleClose={handleClose}
      handleSubmit={() => void handleSubmit()}
      isSubmitting={isSwitching}
      title={t("sso.providers.switch_alert_modal.title", { newProviderShortName: newProviderName.short })}
      content={t("sso.providers.switch_alert_modal.content", {
        newProviderLongName: newProviderName.long,
        newProviderShortName: newProviderName.short,
        activeProviderLongName: activeProviderName.long,
        activeProviderShortName: activeProviderName.short,
      })}
      primaryButtonText={{
        loading: t("sso.providers.switch_alert_modal.primary_button_text_loading"),
        default: t("sso.providers.switch_alert_modal.primary_button_text"),
      }}
      secondaryButtonText={t("sso.providers.switch_alert_modal.secondary_button_text")}
    />
  );
}
