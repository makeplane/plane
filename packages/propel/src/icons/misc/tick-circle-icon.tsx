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

import * as React from "react";

import { IconWrapper } from "../icon-wrapper";
import type { ISvgIcons } from "../type";

export const TickCircleIcon: React.FC<ISvgIcons> = ({ color = "currentColor", ...rest }) => {
  const clipPathId = React.useId();

  return (
    <IconWrapper color={color} clipPathId={clipPathId} {...rest}>
      <path
        d="M14.0413 8.00098C14.0413 4.66437 11.3368 1.95916 8.00024 1.95898C4.66352 1.95898 1.95825 4.66426 1.95825 8.00098C1.95843 11.3375 4.66363 14.042 8.00024 14.042C11.3367 14.0418 14.0411 11.3374 14.0413 8.00098ZM10.5579 5.55859C10.8019 5.31457 11.1976 5.31468 11.4417 5.55859C11.6857 5.80267 11.6857 6.19831 11.4417 6.44238L7.44165 10.4424C7.19757 10.6865 6.80194 10.6865 6.55786 10.4424L4.55786 8.44238C4.31395 8.19829 4.31384 7.80262 4.55786 7.55859C4.80188 7.31457 5.19756 7.31468 5.44165 7.55859L6.99927 9.11621L10.5579 5.55859ZM15.2913 8.00098C15.2911 12.0278 12.0271 15.2918 8.00024 15.292C3.97328 15.292 0.708428 12.0279 0.708252 8.00098C0.708252 3.9739 3.97317 0.708984 8.00024 0.708984C12.0272 0.709161 15.2913 3.97401 15.2913 8.00098Z"
        fill={color}
      />
    </IconWrapper>
  );
};
