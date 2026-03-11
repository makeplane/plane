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

export function SortByDownIcon({ color = "currentColor", ...rest }: ISvgIcons) {
  return (
    <IconWrapper color={color} {...rest}>
      <path
        d="M4.04194 2.66699C4.04194 2.32181 4.32177 2.04199 4.66694 2.04199C5.01197 2.04217 5.29194 2.32192 5.29194 2.66699V11.8242L6.89155 10.2246C7.1356 9.98091 7.53136 9.9808 7.77534 10.2246C8.01942 10.4687 8.01942 10.8653 7.77534 11.1094L5.10835 13.7754C4.99122 13.8925 4.83259 13.9589 4.66694 13.959C4.50118 13.959 4.34177 13.8926 4.22456 13.7754L1.55757 11.1094C1.31349 10.8653 1.31349 10.4687 1.55757 10.2246C1.80165 9.98053 2.19826 9.98053 2.44234 10.2246L4.04194 11.8242V2.66699ZM14 7.375C14.345 7.375 14.6248 7.65497 14.625 8C14.625 8.34518 14.3451 8.625 14 8.625H7.33296C6.98793 8.62482 6.70796 8.34507 6.70796 8C6.70814 7.65508 6.98804 7.37518 7.33296 7.375H14ZM12 4.70898C12.3451 4.70898 12.625 4.98881 12.625 5.33398C12.6248 5.67901 12.345 5.95898 12 5.95898H7.33296C6.98804 5.95881 6.70814 5.6789 6.70796 5.33398C6.70796 4.98892 6.98793 4.70916 7.33296 4.70898H12ZM9.99995 2.04199C10.3451 2.04199 10.625 2.32181 10.625 2.66699C10.625 3.01217 10.3451 3.29199 9.99995 3.29199H7.33296C6.98793 3.29182 6.70796 3.01206 6.70796 2.66699C6.70796 2.32192 6.98793 2.04217 7.33296 2.04199H9.99995Z"
        fill={color}
      />
    </IconWrapper>
  );
}
