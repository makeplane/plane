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

export function JiraIcon({ color = "currentColor", ...rest }: ISvgIcons) {
  return (
    <IconWrapper color={color} {...rest}>
      <path
        d="M14.4198 1H7.67969C7.67969 2.68006 9.03944 4.04044 10.7199 4.04044H11.9595V5.24011C11.9595 6.92017 13.3198 8.28055 14.9998 8.28055V1.58C14.9997 1.42621 14.9386 1.27875 14.8298 1.17001C14.7211 1.06126 14.5736 1.00012 14.4198 1Z"
        fill="#2684FF"
      />
      <path
        d="M11.0792 4.3605H4.33887C4.33887 6.04041 5.69877 7.40079 7.37863 7.40079H8.6188V8.60046C8.6188 10.2805 9.97914 11.6409 11.6591 11.6409V4.94035C11.6589 4.7866 11.5977 4.63921 11.489 4.53049C11.3803 4.42176 11.2329 4.36073 11.0792 4.3605Z"
        fill="url(#paint0_linear_3387_49)"
      />
      <path
        d="M7.7403 7.71973H1C1 9.40037 2.35976 10.7602 4.04035 10.7602H5.27994V11.9604C5.27994 13.6405 6.64028 15.0003 8.32014 15.0003V8.30031C8.31998 8.14652 8.25886 7.99906 8.15017 7.89026C8.04148 7.78145 7.89409 7.72004 7.7403 7.71973Z"
        fill="url(#paint1_linear_3387_49)"
      />
      <defs>
        <linearGradient
          id="paint0_linear_3387_49"
          x1="11.5189"
          y1="4.36808"
          x2="8.65109"
          y2="7.32501"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0.176" stopColor="#0052CC" />
          <stop offset="1" stopColor="#2684FF" />
        </linearGradient>
        <linearGradient
          id="paint1_linear_3387_49"
          x1="8.37395"
          y1="7.74569"
          x2="5.05817"
          y2="10.9715"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0.176" stopColor="#0052CC" />
          <stop offset="1" stopColor="#2684FF" />
        </linearGradient>
      </defs>
    </IconWrapper>
  );
}
