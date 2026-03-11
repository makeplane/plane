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

import { IconWrapper } from "../icon-wrapper";
import type { ISvgIcons } from "../type";

export function AccordionCloseIcon({ color = "currentColor", ...rest }: ISvgIcons) {
  return (
    <IconWrapper color={color} {...rest}>
      <path
        d="M10.9203 7.5808C11.243 7.76711 11.243 8.23289 10.9203 8.4192L6.56383 10.9344C6.24113 11.1207 5.83775 10.8878 5.83775 10.5152V5.48478C5.83775 5.11215 6.24113 4.87926 6.56383 5.06557L10.9203 7.5808Z"
        fill={color}
      />
    </IconWrapper>
  );
}
