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

import { IconWrapper } from "./icon-wrapper";
import type { ISvgIcons } from "./type";

export function DropdownIcon({ color = "currentColor", ...rest }: ISvgIcons) {
  return (
    <IconWrapper color={color} {...rest}>
      <path
        d="M8.4192 10.9201C8.23289 11.2428 7.76711 11.2428 7.5808 10.9201L5.06557 6.56359C4.87926 6.24088 5.11215 5.83751 5.48478 5.83751L10.5152 5.83751C10.8878 5.83751 11.1207 6.24088 10.9344 6.56359L8.4192 10.9201Z"
        fill={color}
      />
    </IconWrapper>
  );
}
