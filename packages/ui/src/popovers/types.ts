/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { Placement } from "@popperjs/core";
import type { MutableRefObject, ReactNode } from "react";

export type TPopoverButtonDefaultOptions = {
  // button and button styling
  button?: ReactNode;
  buttonClassName?: string;
  buttonRefClassName?: string;
  disabled?: boolean;
};

export type TPopoverDefaultOptions = TPopoverButtonDefaultOptions & {
  // popper styling
  popperPosition?: Placement | undefined;
  popperPadding?: number | undefined;
  // panel styling
  panelClassName?: string;
  popoverClassName?: string;
  popoverButtonRef?: MutableRefObject<HTMLButtonElement | null>;
};

export type TPopover = TPopoverDefaultOptions & {
  // children
  children: ReactNode;
};

export type TPopoverMenu<T> = TPopoverDefaultOptions & {
  data: T[];
  keyExtractor: (item: T, index: number) => string;
  render: (item: T, index: number) => ReactNode;
};
