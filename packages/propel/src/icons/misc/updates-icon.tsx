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

export const UpdatesIcon: React.FC<ISvgIcons> = ({ color = "currentColor", ...rest }) => {
  return (
    <IconWrapper color={color} {...rest}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8 1C11.866 1 15 4.13401 15 8C15 11.866 11.866 15 8 15C4.13401 15 1 11.866 1 8C1 4.13401 4.13401 1 8 1ZM8.44434 4.03027C8.31487 3.96615 8.16358 4.00692 8.07324 4.13086L5.2334 8.02734C5.18436 8.0946 5.1348 8.16279 5.09863 8.22266C5.06441 8.2793 5.00196 8.39075 5 8.53711C4.99779 8.70462 5.06286 8.86436 5.17676 8.96973C5.27638 9.06177 5.39216 9.07778 5.45215 9.08398C5.51537 9.0905 5.59261 9.09084 5.66895 9.09082H7.63965L7.36621 11.5908C7.3487 11.751 7.42615 11.9054 7.55566 11.9697C7.68513 12.0339 7.83642 11.9931 7.92676 11.8691L10.7666 7.97266C10.8156 7.9054 10.8652 7.83721 10.9014 7.77734C10.9356 7.7207 10.998 7.60925 11 7.46289C11.0022 7.29538 10.9371 7.13564 10.8232 7.03027C10.7236 6.93823 10.6078 6.92222 10.5479 6.91602C10.4846 6.90951 10.4074 6.90916 10.3311 6.90918H8.36035L8.63379 4.40918C8.6513 4.249 8.57385 4.09455 8.44434 4.03027Z"
        fill={color}
      />
    </IconWrapper>
  );
};
