/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ReactNode, MouseEvent as ReactMouseEvent } from "react";

/** @deprecated Use PortalWrapperProps or ModalPortalProps instead. */
export type PortalBaseConfig = {
  children: ReactNode;
  className?: string;
};

export type PortalEventHandler = () => void;
export type PortalKeyboardHandler = (event: KeyboardEvent) => void;
export type PortalMouseHandler = (event: ReactMouseEvent) => void;

/** @deprecated Use PortalWrapperProps or ModalPortalProps instead. */
export type BasePortalProps = PortalBaseConfig;
