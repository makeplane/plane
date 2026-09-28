/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
// helpers
import { Button } from "@makeplane/propel/elements/button";

type Props = Omit<React.ComponentPropsWithRef<"button">, "className" | "style" | "title" | "children"> & {
  icon: React.ReactNode;
  title: string;
  disabled?: boolean;
};

/**
 * Widget toolbar button. Forwards ref and rest props to the underlying Propel `Button`, so it can be
 * used directly as a trigger's `render` element (e.g. `<MenuTrigger render={<IssueDetailWidgetButton … />} />`).
 */
export function IssueDetailWidgetButton(props: Props) {
  const { icon, title, disabled = false, ...rest } = props;
  return (
    <Button {...rest} variant="secondary" disabled={disabled} size="md" stretch="auto" type="button">
      {icon}
      <span className="text-body-xs-medium">{title}</span>
    </Button>
  );
}
