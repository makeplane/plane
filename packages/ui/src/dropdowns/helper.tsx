// FIXME: fix this!!!
import { Placement } from "@blueprintjs/popover2";
import { ICustomSearchSelectOption } from "@plane/types";

export interface IDropdownProps {
  customButtonClassName?: string;
  customButtonTabIndex?: number;
  buttonClassName?: string;
  className?: string;
  customButton?: JSX.Element;
  disabled?: boolean;
  input?: boolean;
  label?: string | JSX.Element;
  maxHeight?: "sm" | "rg" | "md" | "lg";
  noChevron?: boolean;
  chevronClassName?: string;
  onOpen?: () => void;
  optionsClassName?: string;
  placement?: Placement;
  tabIndex?: number;
  useCaptureForOutsideClick?: boolean;
}

export interface IPortalProps {
  children: React.ReactNode;
  container?: Element | null;
  asChild?: boolean;
}

export interface ICustomMenuDropdownProps extends IDropdownProps {
  children: React.ReactNode;
  ellipsis?: boolean;
  noBorder?: boolean;
  verticalEllipsis?: boolean;
  menuButtonOnClick?: (...args: any) => void;
  menuItemsClassName?: string;
  onMenuClose?: () => void;
  closeOnSelect?: boolean;
  portalElement?: Element | null;
  openOnHover?: boolean;
  ariaLabel?: string;
}

export interface ICustomSelectProps extends IDropdownProps {
  children: React.ReactNode;
  value: any;
  onChange: any;
}

interface CustomSearchSelectProps {
  footerOption?: JSX.Element;
  onChange: any;
  onClose?: () => void;
  noResultsMessage?: string;
  options?: ICustomSearchSelectOption[];
}

interface SingleValueProps {
  multiple?: false;
  value: any;
}

interface MultipleValuesProps {
  multiple?: true;
  value: any[] | null;
}

export type ICustomSearchSelectProps = IDropdownProps &
  CustomSearchSelectProps &
  (SingleValueProps | MultipleValuesProps);

export interface ICustomMenuItemProps {
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: (args?: any) => void;
  className?: string;
}

export interface ICustomSelectItemProps {
  children: React.ReactNode;
  value: any;
  className?: string;
}

// Submenu interfaces
export interface ICustomSubMenuProps {
  children: React.ReactNode;
  trigger: React.ReactNode;
  disabled?: boolean;
  className?: string;
  contentClassName?: string;
  placement?: Placement;
}

export interface ICustomSubMenuTriggerProps {
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

export interface ICustomSubMenuContentProps {
  children: React.ReactNode;
  className?: string;
  placement?: Placement;
  sideOffset?: number;
  alignOffset?: number;
}
