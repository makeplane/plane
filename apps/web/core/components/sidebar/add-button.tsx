/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { MouseEventHandler, ReactNode } from "react";
import { cloneElement, isValidElement } from "react";
import { Button } from "@makeplane/propel/components/button";
import { cn } from "@plane/utils";

function withIconSize(icon: ReactNode, sizeClass: string) {
  if (!isValidElement<{ className?: string }>(icon)) return icon;
  return cloneElement(icon, { className: cn(sizeClass, icon.props.className) });
}

type Props = {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  onMouseEnter?: MouseEventHandler<HTMLSpanElement>;
  onMouseLeave?: MouseEventHandler<HTMLSpanElement>;
};

export function SidebarAddButton(props: Props) {
  const { label, icon, onClick, disabled, onMouseEnter, onMouseLeave } = props;
  return (
    <span className="w-full justify-start" onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <Button
        variant="secondary"
        size="lg"
        stretch="full"
        label={label}
        icon={withIconSize(icon, "size-4")}
        onClick={onClick}
        disabled={disabled}
      />
    </span>
  );
}
