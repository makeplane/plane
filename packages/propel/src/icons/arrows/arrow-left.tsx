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

export function ArrowLeftIcon({ color = "currentColor", ...rest }: ISvgIcons) {
  return (
    <IconWrapper color={color} clipPathId="clip0_2890_23" {...rest}>
      <path
        d="M6.55757 3.55806C6.80165 3.31398 7.19826 3.31398 7.44234 3.55806C7.68641 3.80214 7.68641 4.19875 7.44234 4.44282L4.50972 7.37544H13.6669C14.012 7.37562 14.2919 7.65537 14.2919 8.00044C14.2919 8.34551 14.012 8.62527 13.6669 8.62544H4.50972L7.44234 11.5581C7.68641 11.8021 7.68641 12.1987 7.44234 12.4428C7.19826 12.6869 6.80165 12.6869 6.55757 12.4428L2.55757 8.44282C2.31349 8.19875 2.31349 7.80214 2.55757 7.55806L6.55757 3.55806Z"
        fill={color}
      />
    </IconWrapper>
  );
}
