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

import type { ISvgIcons } from "./type";

type ReleaseStateIconProps = ISvgIcons & { color?: string };

export const ReleaseStateIcon = ({ className, color = "currentColor" }: ReleaseStateIconProps) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path
      d="M14.2044 8.5332C15.0332 8.53349 15.5777 9.39974 15.2181 10.1465L13.3665 13.9883C13.179 14.3774 12.7848 14.6249 12.3529 14.625H2.56087C2.04109 14.625 1.58891 14.269 1.46712 13.7637L0.541339 9.92188C0.370831 9.2142 0.907165 8.53321 1.63509 8.5332H14.2044Z"
      fill={color}
    />
    <path
      d="M11.953 8.54004C12.0166 9.16079 11.5446 9.78294 10.8319 9.7832H3.05557C2.43435 9.7832 1.93074 9.27938 1.93057 8.6582V8.54004H11.953Z"
      fill={color}
    />
    <path
      d="M3.61124 1.375C4.2325 1.37506 4.73624 1.87872 4.73624 2.5V4.74316H8.54092C8.8357 4.74316 9.11723 4.85912 9.32608 5.0625L9.41104 5.1543L11.37 7.54004H1.93057V5.86816C1.93071 5.24696 2.43434 4.74316 3.05557 4.74316H3.48624V2.625H3.33291C2.98794 2.62477 2.70791 2.34503 2.70791 2C2.70791 1.65497 2.98794 1.37523 3.33291 1.375H3.61124Z"
      fill={color}
    />
  </svg>
);
