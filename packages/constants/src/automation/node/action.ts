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

import type { TActionNodeHandlerName, TIntegrationKeys } from "@plane/types";
import { E_INTEGRATION_KEYS, EActionNodeHandlerName } from "@plane/types";

export type TAutomationActionHandlerIconKey = "message-circle" | "circle-chevron-down" | "file-code";

export type TAutomationActionHandlerOption = {
  value: TActionNodeHandlerName;
  labelI18nKey: string;
  iconKey: TAutomationActionHandlerIconKey;
  // Optional integrationKey, this needs to be populated if action node is related
  // to a particular integration
  integrationKey?: TIntegrationKeys;
};

export const AUTOMATION_ACTION_HANDLER_OPTIONS: TAutomationActionHandlerOption[] = [
  {
    value: EActionNodeHandlerName.ADD_COMMENT,
    labelI18nKey: "automations.action.handler_name.add_comment",
    iconKey: "message-circle",
  },
  {
    value: EActionNodeHandlerName.CHANGE_PROPERTY,
    labelI18nKey: "automations.action.handler_name.change_property",
    iconKey: "circle-chevron-down",
  },
  {
    value: EActionNodeHandlerName.RUN_SCRIPT,
    labelI18nKey: "automations.action.handler_name.run_script",
    iconKey: "file-code",
    integrationKey: E_INTEGRATION_KEYS.RUNNER,
  },
];
