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

export const HistoryIcon: React.FC<ISvgIcons> = ({ color = "currentColor", ...rest }) => {
  const clipPathId = React.useId();
  return (
    <IconWrapper color={color} clipPathId={clipPathId} {...rest}>
      <path
        d="M2.02135 3.87568C4.14482 0.784525 8.32056 -0.207802 11.6307 1.69111C15.1152 3.69024 16.3193 8.13532 14.3202 11.6198C12.321 15.1043 7.87595 16.3084 4.39147 14.3093C2.40937 13.172 1.16532 11.2424 0.82897 9.15107C0.774277 8.81043 1.00596 8.49019 1.34655 8.43525C1.68735 8.38044 2.00853 8.61203 2.06334 8.95283C2.3424 10.6877 3.37248 12.2837 5.01354 13.2253C7.89924 14.8809 11.5806 13.8835 13.2362 10.9978C14.8917 8.11207 13.8943 4.43066 11.0087 2.7751C8.17658 1.15057 4.57934 2.08154 2.8817 4.84443L3.73815 4.61299C4.0713 4.52279 4.4145 4.7203 4.50475 5.05342C4.59495 5.38658 4.39845 5.72979 4.0653 5.82002L2.04772 6.36592C1.88799 6.40909 1.71767 6.38759 1.57409 6.30537C1.43037 6.22289 1.32446 6.0864 1.28112 5.92646L0.73522 3.90986C0.645014 3.57668 0.842467 3.23347 1.17565 3.14326C1.50876 3.05316 1.85202 3.24963 1.94225 3.58271L2.02135 3.87568ZM7.32213 4.73213C7.32229 4.38708 7.60205 4.10713 7.94713 4.10713C8.29213 4.10723 8.57198 4.38714 8.57213 4.73213V8.0915L10.5096 9.3835C10.7968 9.57497 10.8749 9.96348 10.6835 10.2507C10.492 10.5378 10.1035 10.615 9.81627 10.4235L7.60045 8.946C7.42665 8.83012 7.32221 8.63534 7.32213 8.42646V4.73213Z"
        fill={color}
      />
    </IconWrapper>
  );
};
