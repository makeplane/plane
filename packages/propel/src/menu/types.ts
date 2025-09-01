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
};

export type TMenuItemProps = {
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: (_args?: unknown) => void;
  className?: string;
};
