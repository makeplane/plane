/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Button } from "@makeplane/propel/elements/button";

type Props = React.ComponentProps<"button"> & {
  label: React.ReactNode;
  onClick: () => void;
};

export function SidebarAddButton(props: Props) {
  const { label, onClick, disabled, ...rest } = props;
  return (
    <Button type="button" variant="secondary" size="lg" stretch="full" onClick={onClick} disabled={disabled} {...rest}>
      <span className="flex w-full items-center justify-start gap-2">{label}</span>
    </Button>
  );
}
