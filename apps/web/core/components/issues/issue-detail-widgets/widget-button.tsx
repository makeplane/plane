/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
// helpers
import { Button } from "@plane/propel/button";

type Props = {
  icon: React.ReactNode;
  title: string;
  disabled?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
};

export function IssueDetailWidgetButton(props: Props) {
  const { icon, title, disabled = false, onClick } = props;
  return (
    <Button variant={"secondary"} disabled={disabled} onClick={onClick} size="lg">
      {icon && icon}
      <span className="text-body-xs-medium">{title}</span>
    </Button>
  );
}
