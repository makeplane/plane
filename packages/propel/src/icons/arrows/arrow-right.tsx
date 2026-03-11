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

export function ArrowRightIcon({ color = "currentColor", ...rest }: ISvgIcons) {
  return (
    <IconWrapper color={color} clipPathId="clip0_2890_23" {...rest}>
      <path
        d="M8.89111 3.55684C9.1351 3.31303 9.53085 3.31314 9.7749 3.55684L13.7749 7.55684C14.019 7.80092 14.019 8.19753 13.7749 8.4416L9.7749 12.4416C9.53085 12.6853 9.1351 12.6854 8.89111 12.4416C8.64704 12.1975 8.64704 11.8009 8.89111 11.5568L11.8237 8.62422H2.6665C2.32133 8.62422 2.0415 8.3444 2.0415 7.99922C2.0415 7.65404 2.32133 7.37422 2.6665 7.37422H11.8237L8.89111 4.4416C8.64704 4.19753 8.64704 3.80092 8.89111 3.55684Z"
        fill={color}
      />
    </IconWrapper>
  );
}
