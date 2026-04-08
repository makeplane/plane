/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

export type TPlacement = "top" | "bottom" | "left" | "right";

export type TMenuProps = {
  customButtonClassName?: string;
  customButtonTabIndex?: number;
  buttonClassName?: string;
  className?: string;
  customButton?: React.ReactNode;
  disabled?: boolean;
  input?: boolean;
  label?: string | React.ReactNode;
  maxHeight?: "sm" | "rg" | "md" | "lg";
  noChevron?: boolean;
  chevronClassName?: string;
  onOpen?: () => void;
  optionsClassName?: string;
  placement?: TPlacement;
  tabIndex?: number;
  useCaptureForOutsideClick?: boolean;
  children: React.ReactNode;
  ellipsis?: boolean;
  noBorder?: boolean;
  verticalEllipsis?: boolean;
  menuButtonOnClick?: (..._args: unknown[]) => void;
  menuItemsClassName?: string;
  onMenuClose?: () => void;
  closeOnSelect?: boolean;
  portalElement?: Element | null;
  openOnHover?: boolean;
  ariaLabel?: string;
  handleOpenChange?: (open: boolean) => void;
};

export type TSubMenuProps = {
  children: React.ReactNode;
  trigger: React.ReactNode;
  disabled?: boolean;
  className?: string;
  contentClassName?: string;
  placement?: TPlacement;
  showChevron?: boolean;
};

export type TMenuItemProps = {
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: (_args?: unknown) => void;
  className?: string;
  /** When false, clicking the item will not close the menu. Default: true */
  closeOnClick?: boolean;
};
