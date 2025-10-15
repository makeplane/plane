"use client";

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

const Link: React.FC<NextLinkProps> = ({
  href,
  replace,
  prefetch: _prefetch,
  scroll: _scroll,
  shallow: _shallow,
  ...rest
}) => <RRLink to={ensureTrailingSlash(href)} replace={replace} {...rest} />;

export default Link;

