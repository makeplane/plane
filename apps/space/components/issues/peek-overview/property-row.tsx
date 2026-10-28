/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ReactNode } from "react";
import type { IconGlyph } from "@makeplane/propel/components/icon";

type Props = {
  icon: IconGlyph;
  label: string;
  children: ReactNode;
};

/** One peek property: a fixed-width icon + label column beside the read-only value. */
export function PeekPropertyRow(props: Props) {
  const { icon: Icon, label, children } = props;

  return (
    <div className="flex items-start gap-2">
      <div className="flex min-h-8 w-30 shrink-0 items-center gap-1.5 text-body-xs-regular text-tertiary">
        <Icon className="size-4 shrink-0" />
        <span className="truncate">{label}</span>
      </div>
      <div className="flex min-h-8 min-w-0 grow flex-wrap items-center gap-1">{children}</div>
    </div>
  );
}
