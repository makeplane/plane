/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { Link as RouterLink } from "react-router";
// plane imports
import { ensureTrailingSlash } from "@plane/utils";

// Matches anything that is not an in-app route: a protocol (https:, mailto:), a
// protocol-relative URL, or a bare fragment.
const NON_ROUTE_HREF_REGEX = /^([a-z][a-z0-9+.-]*:|\/\/|#)/i;

export type TLinkProps = React.ComponentProps<"a"> & {
  href: string;
  replace?: boolean;
};

/**
 * Router-aware anchor. In-app routes are normalized to a trailing slash so they stay
 * consistent with the slash-terminated hrefs that active-state checks compare against.
 * External and fragment targets are handed to a plain anchor untouched.
 */
export const Link = React.forwardRef<HTMLAnchorElement, TLinkProps>(function Link(
  { href, replace, children, ...rest },
  ref
) {
  if (NON_ROUTE_HREF_REGEX.test(href)) {
    return (
      <a ref={ref} href={href} {...rest}>
        {children}
      </a>
    );
  }

  return (
    <RouterLink ref={ref} to={ensureTrailingSlash(href)} replace={replace} {...rest}>
      {children}
    </RouterLink>
  );
});

export default Link;
