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

export function AccordionOpenIcon({ color = "currentColor", ...rest }: ISvgIcons) {
  return (
    <IconWrapper color={color} viewBox="0 0 14 14" {...rest}>
      <path
        d="M7.3668 9.61774C7.20378 9.90011 6.79622 9.9001 6.6332 9.61774L4.43238 5.80581C4.26935 5.52344 4.47313 5.17049 4.79918 5.17049L9.20082 5.17049C9.52687 5.17049 9.73065 5.52344 9.56762 5.80581L7.3668 9.61774Z"
        fill={color}
      />
    </IconWrapper>
  );
}
