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

import { CircleChevronDown, FileCode, MessageCircle } from "lucide-react";
// plane imports
import type { TAutomationActionHandlerIconKey } from "@plane/constants";

type Props = {
  iconKey: TAutomationActionHandlerIconKey;
};

const COMMON_ICON_CLASSNAME = "size-3.5 flex-shrink-0";

export function AutomationActionHandlerIcon(props: Props) {
  switch (props.iconKey) {
    case "message-circle":
      return <MessageCircle className={COMMON_ICON_CLASSNAME} />;
    case "circle-chevron-down":
      return <CircleChevronDown className={COMMON_ICON_CLASSNAME} />;
    case "file-code":
      return <FileCode className={COMMON_ICON_CLASSNAME} />;
    default:
      return null;
  }
}
