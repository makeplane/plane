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

export function ToDoListIcon({ color = "currentColor", ...rest }: ISvgIcons) {
  return (
    <IconWrapper color={color} {...rest}>
      <path
        d="M13.9999 2.70866C14.345 2.70866 14.6249 2.98848 14.6249 3.33366C14.6249 3.67884 14.345 3.95866 13.9999 3.95866H8.66686C8.32169 3.95866 8.04186 3.67884 8.04186 3.33366C8.04186 2.98848 8.32169 2.70866 8.66686 2.70866H13.9999Z"
        fill={color}
      />
      <path
        d="M13.9999 7.37533C14.345 7.37533 14.6249 7.65515 14.6249 8.00033C14.6249 8.3455 14.345 8.62533 13.9999 8.62533H8.66686C8.32169 8.62533 8.04186 8.3455 8.04186 8.00033C8.04186 7.65515 8.32169 7.37533 8.66686 7.37533H13.9999Z"
        fill={color}
      />
      <path
        d="M13.9999 12.042C14.345 12.042 14.6249 12.3218 14.6249 12.667C14.6249 13.0122 14.345 13.292 13.9999 13.292H8.66686C8.32169 13.292 8.04186 13.0122 8.04186 12.667C8.04186 12.3218 8.32169 12.042 8.66686 12.042H13.9999Z"
        fill={color}
      />
      <path
        d="M5.55781 9.55794C5.80189 9.31387 6.1985 9.31387 6.44258 9.55794C6.68666 9.80202 6.68666 10.1986 6.44258 10.4427L3.77559 13.1087C3.53151 13.3528 3.13588 13.3528 2.8918 13.1087L1.55781 11.7757C1.31401 11.5317 1.31412 11.136 1.55781 10.8919C1.80189 10.6479 2.1985 10.6479 2.44258 10.8919L3.3332 11.7826L5.55781 9.55794Z"
        fill={color}
      />
      <path
        d="M5.3752 3.33398C5.3752 3.31097 5.35622 3.29199 5.3332 3.29199H2.66719C2.64418 3.29199 2.6252 3.31097 2.6252 3.33398V6C2.6252 6.02301 2.64418 6.04199 2.66719 6.04199H5.3332C5.35622 6.04199 5.3752 6.02301 5.3752 6V3.33398ZM6.6252 6C6.6252 6.71337 6.04657 7.29199 5.3332 7.29199H2.66719C1.95382 7.29199 1.3752 6.71337 1.3752 6V3.33398C1.3752 2.62062 1.95382 2.04199 2.66719 2.04199H5.3332C6.04657 2.04199 6.6252 2.62062 6.6252 3.33398V6Z"
        fill={color}
      />
    </IconWrapper>
  );
}
