/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
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

function Link({ href, replace, prefetch: _prefetch, scroll: _scroll, shallow: _shallow, ...rest }: NextLinkProps) {
  return <RRLink to={ensureTrailingSlash(href)} replace={replace} {...rest} />;
}

export default Link;
