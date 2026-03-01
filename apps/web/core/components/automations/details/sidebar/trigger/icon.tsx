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

import { MessageCircle } from "lucide-react";
import type { TAutomationTriggerIconKey } from "@plane/constants";
import { LayersIcon, MembersPropertyIcon, StatePropertyIcon } from "@plane/propel/icons";

type Props = {
  iconKey: TAutomationTriggerIconKey;
};

const COMMON_ICON_CLASSNAME = "size-3.5 flex-shrink-0";

export function AutomationTriggerIcon(props: Props) {
  switch (props.iconKey) {
    case "LayersIcon":
      return <LayersIcon className={COMMON_ICON_CLASSNAME} />;
    case "DoubleCircleIcon":
      return <StatePropertyIcon className={COMMON_ICON_CLASSNAME} />;
    case "Users":
      return <MembersPropertyIcon className={COMMON_ICON_CLASSNAME} />;
    case "MessageCircle":
      return <MessageCircle className={COMMON_ICON_CLASSNAME} />;
    default:
      return null;
  }
}
