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

import { observer } from "mobx-react";
import { Zap } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
// local imports
import { CreateAutomationButton } from "./create-button";

export const NoAutomationsEmptyState = observer(function NoAutomationsEmptyState() {
  // plane hooks
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center text-center gap-4 px-4 py-10 border-b border-subtle">
      <span className="flex flex-shrink-0 items-center justify-center size-8 rounded-sm bg-layer-1/70">
        <Zap className="size-4 text-tertiary" strokeWidth={1.5} />
      </span>
      <p className="flex flex-col gap-0.5">
        <span className="text-13 font-medium text-secondary">{t("automations.empty_state.no_automations.title")}</span>
        <span className="text-11 text-tertiary">{t("automations.empty_state.no_automations.description")}</span>
      </p>
      <CreateAutomationButton variant="secondary" />
    </div>
  );
});
