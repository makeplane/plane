/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { MouseEventHandler, ReactNode } from "react";
import { Button } from "@makeplane/propel/components/button";

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
        icon={icon}
        onClick={onClick}
        disabled={disabled}
      />
    </span>
  );
}
