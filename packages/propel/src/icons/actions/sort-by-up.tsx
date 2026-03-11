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

export function SortByUpIcon({ color = "currentColor", ...rest }: ISvgIcons) {
  return (
    <IconWrapper color={color} {...rest}>
      <path
        d="M4.32344 2.14463C4.56586 1.98492 4.89517 2.01159 5.1086 2.22471L7.77559 4.8917C8.01961 5.13572 8.0195 5.5314 7.77559 5.77549C7.53151 6.01956 7.13588 6.01956 6.8918 5.77549L4.66621 3.55088L2.44258 5.77549C2.1985 6.01956 1.80189 6.01956 1.55781 5.77549C1.31412 5.53144 1.31401 5.13568 1.55781 4.8917L4.22481 2.22471L4.32344 2.14463Z"
        fill={color}
      />
      <path
        d="M4.04186 13.3341V2.66709C4.04186 2.32191 4.32169 2.04209 4.66686 2.04209C5.01204 2.04209 5.29186 2.32191 5.29186 2.66709V13.3341C5.29169 13.6791 5.01193 13.9591 4.66686 13.9591C4.32179 13.9591 4.04204 13.6791 4.04186 13.3341Z"
        fill={color}
      />
      <path
        d="M10.0005 7.37542C10.3456 7.3756 10.6255 7.65535 10.6255 8.00042C10.6255 8.34549 10.3456 8.62525 10.0005 8.62542H7.33353C6.98835 8.62542 6.70853 8.3456 6.70853 8.00042C6.70853 7.65524 6.98835 7.37542 7.33353 7.37542H10.0005Z"
        fill={color}
      />
      <path
        d="M12.0005 10.0421C12.3456 10.0423 12.6255 10.322 12.6255 10.6671C12.6255 11.0122 12.3456 11.2919 12.0005 11.2921H7.33353C6.98835 11.2921 6.70853 11.0123 6.70853 10.6671C6.70853 10.3219 6.98835 10.0421 7.33353 10.0421H12.0005Z"
        fill={color}
      />
      <path
        d="M14.0005 12.7088C14.3456 12.7089 14.6255 12.9887 14.6255 13.3338C14.6255 13.6788 14.3456 13.9586 14.0005 13.9588H7.33353C6.98835 13.9588 6.70853 13.6789 6.70853 13.3338C6.70853 12.9886 6.98835 12.7088 7.33353 12.7088H14.0005Z"
        fill={color}
      />
    </IconWrapper>
  );
}
