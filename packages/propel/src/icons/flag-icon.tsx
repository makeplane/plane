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

import type { ISvgIcons } from "./type";

export function FlagIcon({ className = "text-current", ...rest }: ISvgIcons) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...rest}>
      <path
        d="M2.04169 14V2.00001C2.04169 1.83424 2.10709 1.67483 2.2243 1.55762C2.34151 1.44041 2.50093 1.37501 2.66669 1.37501H13.0583C13.2 1.375 13.35 1.37443 13.4733 1.38575C13.5779 1.39535 13.7452 1.41828 13.9089 1.51465L13.9782 1.56055L14.0573 1.62598C14.2074 1.76307 14.31 1.94429 14.3503 2.14356L14.3659 2.24415L14.3688 2.32813C14.3672 2.51798 14.3011 2.67304 14.2556 2.76758C14.2018 2.87914 14.1244 3.00741 14.0515 3.12891L12.7292 5.33301L14.0515 7.53711C14.1244 7.65862 14.2018 7.78684 14.2556 7.89844C14.3076 8.00642 14.387 8.19404 14.3659 8.42188C14.3405 8.69455 14.1989 8.94339 13.9782 9.10547C13.7938 9.24089 13.5928 9.27028 13.4733 9.28126C13.35 9.29257 13.2 9.292 13.0583 9.292H3.29169V14C3.29169 14.3452 3.01186 14.625 2.66669 14.625C2.32151 14.625 2.04169 14.3452 2.04169 14ZM3.29169 8.042H12.8962L11.6286 5.92969C11.5913 5.8676 11.4917 5.71586 11.4528 5.53907C11.4231 5.40369 11.4231 5.26332 11.4528 5.12793L11.4909 5.00098C11.5371 4.88076 11.6006 4.78392 11.6286 4.73731L12.8962 2.62501H3.29169V8.042Z"
        fill="currentColor"
      />
    </svg>
  );
}
