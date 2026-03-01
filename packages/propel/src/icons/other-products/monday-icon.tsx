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

export function MondayIcon({ color = "currentColor", ...rest }: ISvgIcons) {
  return (
    <IconWrapper color={color} {...rest}>
      <path
        d="M2.74155 12.9561C2.43207 12.9568 2.12796 12.8698 1.86029 12.7041C1.59261 12.5383 1.37096 12.2998 1.21799 12.0127C1.06734 11.7277 0.99221 11.4043 1.00064 11.0772C1.00907 10.7501 1.10074 10.4316 1.26584 10.1558L4.40337 4.89874C4.56395 4.6162 4.79194 4.38421 5.06406 4.22645C5.33618 4.0687 5.64266 3.99085 5.95221 4.00086C6.26152 4.00876 6.5633 4.1042 6.82668 4.27743C7.09007 4.45066 7.30558 4.69544 7.45117 4.98674C7.74369 5.57683 7.7071 6.28677 7.35683 6.84075L4.22127 12.0978C4.06227 12.3622 3.84328 12.5795 3.58462 12.7295C3.32595 12.8795 3.03597 12.9575 2.74155 12.9561Z"
        fill="#F62B54"
      />
      <path
        d="M8.12327 12.956C7.49043 12.956 6.90813 12.595 6.60232 12.0148C6.45201 11.7306 6.37705 11.408 6.38548 11.0818C6.39391 10.7556 6.48541 10.4379 6.65017 10.163L9.78175 4.91789C9.93997 4.63138 10.1672 4.39525 10.4397 4.23401C10.7123 4.07277 11.0204 3.99229 11.3319 4.00092C11.9701 4.0158 12.5484 4.39665 12.8409 4.99246C12.9836 5.28421 13.0486 5.61217 13.0287 5.9406C13.0087 6.26902 12.9047 6.58531 12.7279 6.85499L9.59696 12.1C9.43845 12.3633 9.22036 12.5797 8.9628 12.7293C8.70524 12.8789 8.41652 12.9568 8.12327 12.956Z"
        fill="#FFCC00"
      />
      <path
        d="M13.3847 13C14.2768 13 15 12.2445 15 11.3126C15 10.3807 14.2768 9.62527 13.3847 9.62527C12.4925 9.62527 11.7693 10.3807 11.7693 11.3126C11.7693 12.2445 12.4925 13 13.3847 13Z"
        fill="#00CA72"
      />
    </IconWrapper>
  );
}
