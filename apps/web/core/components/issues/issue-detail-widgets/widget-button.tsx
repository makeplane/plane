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

/**
 * Rendered as a <span>, never a <button>: every call site passes this as the `customButton` of a
 * CustomMenu, which already wraps it in a <button> of its own and carries the real disabled state.
 * Only the secondary-button styling is reproduced here.
 */
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
