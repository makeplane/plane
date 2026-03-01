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
import type {
  EAutomationNodeType,
  TAutomationTriggerNodeConfig,
  TTriggerNodeHandlerName,
  TAutomationTriggerNode,
} from "@plane/types";
// local imports
import type { IAutomationBaseNode, TAutomationBaseNodeHelpers } from "./base";
import { AutomationBaseNode } from "./base";

export type IAutomationTriggerNodeInstance = IAutomationBaseNode<
  EAutomationNodeType.TRIGGER,
  TTriggerNodeHandlerName,
  TAutomationTriggerNodeConfig
>;

export type TAutomationTriggerNodeHelpers = TAutomationBaseNodeHelpers<
  EAutomationNodeType.TRIGGER,
  TTriggerNodeHandlerName,
  TAutomationTriggerNodeConfig
>;

export class AutomationTriggerNodeInstance
  extends AutomationBaseNode<EAutomationNodeType.TRIGGER, TTriggerNodeHandlerName, TAutomationTriggerNodeConfig>
  implements IAutomationTriggerNodeInstance
{
  constructor(node: TAutomationTriggerNode, helpers: TAutomationTriggerNodeHelpers) {
    super(node, helpers);
  }
}
