/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { UpgradeOutline } from "@makeplane/propel/icons";
// helpers
import { cn } from "@plane/utils";

type TProIcon = {
  className?: string;
};

export function ProIcon(props: TProIcon) {
  const { className } = props;

  return <UpgradeOutline className={cn("text-amber-400 inline-block h-3.5 w-3.5", className)} />;
}
