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

export function ClickupIcon({ color = "currentColor", ...rest }: ISvgIcons) {
  return (
    <IconWrapper color={color} {...rest}>
      <path
        d="M2 11.7561L4.214 10.1064C5.3906 11.5997 6.6404 12.2875 8.0318 12.2875C9.416 12.2875 10.6298 11.6073 11.7536 10.1268L14 11.7362C12.3788 13.8713 10.3646 15 8.0318 15C5.7068 15 3.6728 13.8788 2 11.7561ZM8.024 4.5875L4.0832 7.88917L2.2616 5.83583L8.033 1L13.7588 5.83933L11.9288 7.88625L8.024 4.5875Z"
        fill="black"
      />
    </IconWrapper>
  );
}
