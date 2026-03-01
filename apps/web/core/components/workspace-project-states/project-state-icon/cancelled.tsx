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

import type { FC } from "react";
// types
import type { TSvgIcons } from "./types";

export function CancelledIcon(props: TSvgIcons) {
  const { width, height, className, color, ...rest } = props;

  return (
    <>
      <svg
        width={width}
        height={height}
        className={`${className}`}
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        {...rest}
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M1 3.8C1 2.2536 2.2536 1 3.8 1H12.2C13.7464 1 15 2.2536 15 3.8V12.2C15 13.7464 13.7464 15 12.2 15H3.8C2.2536 15 1 13.7464 1 12.2V3.8ZM11.1018 4.89826C11.3947 5.19115 11.3947 5.66603 11.1018 5.95892L9.06068 8.00002L11.1018 10.0411C11.3947 10.334 11.3947 10.8089 11.1018 11.1018C10.8089 11.3947 10.334 11.3947 10.0411 11.1018L8.00002 9.06068L5.95892 11.1018C5.66603 11.3947 5.19115 11.3947 4.89826 11.1018C4.60537 10.8089 4.60537 10.334 4.89826 10.0411L6.93936 8.00002L4.89826 5.95892C4.60537 5.66603 4.60537 5.19115 4.89826 4.89826C5.19115 4.60537 5.66603 4.60537 5.95892 4.89826L8.00002 6.93936L10.0411 4.89826C10.334 4.60537 10.8089 4.60537 11.1018 4.89826Z"
          fill={color}
        />
      </svg>
    </>
  );
}
