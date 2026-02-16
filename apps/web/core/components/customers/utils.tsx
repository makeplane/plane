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

import type { TCustomer } from "@plane/types";
import { getFileURL } from "@plane/utils";

/**
 * Resolves the customer logo source URL with priority:
 * 1. Uploaded asset (logo_url via getFileURL)
 * 2. Crawler favicon (logo_props.favicon — base64 data URL or absolute URL)
 * 3. undefined (no logo available)
 */
export const getCustomerLogoSrc = (customer: TCustomer | undefined): string | undefined => {
  if (customer?.logo_url) return getFileURL(customer.logo_url);
  if (customer?.logo_props?.favicon) return customer.logo_props.favicon;
  return undefined;
};

export const getAbbreviatedNumber = (n: number) => {
  if (n >= 1e6) {
    return (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (n >= 1e3) {
    return (n / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
  }
  return n;
};
