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

export function AsanaIcon({ color = "currentColor", ...rest }: ISvgIcons) {
  return (
    <IconWrapper color={color} {...rest}>
      <path
        d="M11.9883 8.38227C10.3016 8.38227 8.93439 9.75175 8.93439 11.4411C8.93439 13.1305 10.3016 14.5 11.9883 14.5C13.6749 14.5 15.0422 13.1305 15.0422 11.4411C15.0422 9.75175 13.6749 8.38227 11.9883 8.38227ZM4.0539 8.38254C2.3673 8.38254 1 9.75175 1 11.4411C1 13.1305 2.3673 14.5 4.0539 14.5C5.74061 14.5 7.10797 13.1305 7.10797 11.4411C7.10797 9.75175 5.74061 8.38254 4.0539 8.38254ZM11.075 4.55876C11.075 6.24814 9.7077 7.61779 8.02115 7.61779C6.33444 7.61779 4.96719 6.24814 4.96719 4.55876C4.96719 2.86953 6.33439 1.5 8.0211 1.5C9.70764 1.5 11.0749 2.86964 11.0749 4.5587"
        fill="#F06A6A"
      />
    </IconWrapper>
  );
}
