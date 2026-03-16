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

export const ReleaseIcon = ({ className, color }: ISvgIcons) => (
  <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path
      d="M2.65828 13.375H12.2745L14.005 9.7832H1.79305L2.65828 13.375ZM3.18074 8.5332H10.5675L8.4825 5.99316H3.18074V8.5332ZM4.73641 4.74316H8.54109C8.83589 4.74316 9.1174 4.85909 9.32625 5.0625L9.41121 5.1543L12.1846 8.5332H14.2042C15.0333 8.53325 15.5778 9.39956 15.2179 10.1465L13.3663 13.9883C13.1787 14.3775 12.7847 14.625 12.3526 14.625H2.56063C2.04086 14.625 1.58869 14.2689 1.46688 13.7637L0.541095 9.92188C0.370587 9.2142 0.906921 8.53321 1.63485 8.5332H1.93074V5.86816C1.93088 5.24696 2.43451 4.74316 3.05574 4.74316H3.48641V2.625H3.33309C2.98806 2.62482 2.70809 2.34507 2.70809 2C2.70809 1.65493 2.98806 1.37518 3.33309 1.375H3.61141C4.23263 1.37512 4.73641 1.87875 4.73641 2.5V4.74316Z"
      fill={color ?? "currentColor"}
    />
  </svg>
);
