/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
// helpers
import { getButtonStyling } from "@plane/propel/button";
import { cn } from "@plane/utils";

type Props = {
  icon: React.ReactNode;
  title: string;
  disabled?: boolean;
};

export function IssueDetailWidgetButton(props: Props) {
  const { icon, title, disabled = false } = props;
  return (
    <span
      className={cn(getButtonStyling("secondary", "lg"), {
        "pointer-events-none border-subtle-1 bg-layer-transparent text-disabled": disabled,
      })}
    >
      {icon}
      <span className="text-body-xs-medium">{title}</span>
    </span>
  );
}
