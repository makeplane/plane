/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Link } from "react-router";
import type { LinkProps } from "react-router";
import { Tab } from "@makeplane/propel/components/tabs";
import type { TabProps } from "@makeplane/propel/components/tabs";

type TUnderlineTabLinkProps = Omit<TabProps, "nativeButton" | "render"> & {
  to: LinkProps["to"];
  linkProps?: Omit<LinkProps, "children" | "className" | "to">;
};

/**
 * Renders an underline tab as a real navigation link without replacing Propel's
 * styled tab element. This keeps native link behavior such as opening in a new tab.
 */
export function UnderlineTabLink({ to, linkProps, ...props }: TUnderlineTabLinkProps) {
  if (props.disabled) return <Tab {...props} />;

  return <Tab {...props} nativeButton={false} render={<Link to={to} {...linkProps} />} />;
}
