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
import { Link as RRLink } from "react-router";
import { ensureTrailingSlash } from "./helper";

type NextLinkProps = React.ComponentProps<"a"> & {
  href: string;
  replace?: boolean;
  prefetch?: boolean; // next.js prop, ignored
  scroll?: boolean; // next.js prop, ignored
  shallow?: boolean; // next.js prop, ignored
};

/**
 * @deprecated Legacy Next.js compatibility shim. Use Link from react-router directly instead.
 */
function Link({ href, replace, prefetch: _prefetch, scroll: _scroll, shallow: _shallow, ...rest }: NextLinkProps) {
  return <RRLink to={ensureTrailingSlash(href)} replace={replace} {...rest} />;
}

/**
 * @deprecated Legacy Next.js compatibility shim. Use Link from react-router directly instead.
 */
export default Link;
