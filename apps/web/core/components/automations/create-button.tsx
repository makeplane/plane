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
import { useTranslation } from "@plane/i18n";
import type { TButtonVariant } from "@plane/propel/button";
import { Button } from "@plane/propel/button";
// plane web imports
import { useAutomations } from "@/plane-web/hooks/store/automations/use-automations";

type TProps = {
  variant?: TButtonVariant;
};

export function CreateAutomationButton(props: TProps) {
  const { variant = "primary" } = props;
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const {
    projectAutomations: { setCreateUpdateModalConfig },
  } = useAutomations();

  return (
    <Button
      variant={variant}
      onClick={() => {
        setCreateUpdateModalConfig({ isOpen: true, payload: null });
      }}
    >
      {t("automations.settings.create_automation")}
    </Button>
  );
}
