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

import React from "react";
import { IconWrapper } from "../icon-wrapper";
import type { ISvgIcons } from "../type";

export function CompletedAtPropertyIcon({ color = "currentColor", ...rest }: ISvgIcons) {
  const clipPathId = React.useId();

  return (
    <IconWrapper color={color} clipPathId={clipPathId} {...rest}>
      <path
        d="M13.5579 10.5576C13.8019 10.3136 14.1976 10.3137 14.4417 10.5576C14.6857 10.8017 14.6857 11.1973 14.4417 11.4414L11.4417 14.4414C11.1976 14.6855 10.8019 14.6855 10.5579 14.4414L9.22485 13.1084C8.98078 12.8643 8.98078 12.4687 9.22485 12.2246C9.46893 11.9805 9.86456 11.9805 10.1086 12.2246L10.9993 13.1152L13.5579 10.5576ZM7.37524 4C7.37524 3.65482 7.65507 3.375 8.00024 3.375C8.34527 3.37518 8.62524 3.65493 8.62524 4V7.61328L10.7717 8.68652C11.0805 8.84089 11.2054 9.21665 11.051 9.52539C10.8967 9.83392 10.5218 9.95878 10.2131 9.80469L7.71997 8.55859C7.50855 8.4527 7.37537 8.23646 7.37524 8V4ZM14.0413 8C14.0413 4.66339 11.3368 1.95818 8.00024 1.95801C4.66352 1.95801 1.95825 4.66328 1.95825 8C1.95843 11.2837 4.57877 13.9553 7.84204 14.0391C8.18676 14.0481 8.45904 14.335 8.45044 14.6797C8.44158 15.0247 8.15475 15.2978 7.80981 15.2891C3.87066 15.1879 0.708425 11.9633 0.708252 8C0.708252 3.97292 3.97317 0.708008 8.00024 0.708008C12.0272 0.708184 15.2913 3.97303 15.2913 8C15.2913 8.13418 15.2877 8.26788 15.2805 8.40039C15.2617 8.74476 14.9677 9.00867 14.6233 8.99023C14.2786 8.97156 14.0138 8.6767 14.0325 8.33203C14.0384 8.22216 14.0413 8.11147 14.0413 8Z"
        fill={color}
      />
    </IconWrapper>
  );
}
