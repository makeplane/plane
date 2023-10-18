import { Placement } from "@blueprintjs/popover2";

export interface IDropdownProps {
  customButtonClassName?: string;
  buttonClassName?: string;
  className?: string;
  customButton?: JSX.Element;
  disabled?: boolean;
  input?: boolean;
  label?: string | JSX.Element;
  maxHeight?: "sm" | "rg" | "md" | "lg";
  noChevron?: boolean;
  onOpen?: () => void;
  optionsClassName?: string;
  width?: "auto" | string;
  placement?: Placement;
}

export interface ICustomMenuDropdownProps extends IDropdownProps {
  children: React.ReactNode;
  ellipsis?: boolean;
  noBorder?: boolean;
  verticalEllipsis?: boolean;
  menuButtonOnClick?: (...args: any) => void;
}

export interface ICustomSelectProps extends IDropdownProps {
  children: React.ReactNode;
  value: any;
  onChange: any;
}

export interface ICustomMenuItemProps {
  children: React.ReactNode;
  onClick?: (args?: any) => void;
  className?: string;
}

export interface ICustomSelectItemProps {
  children: React.ReactNode;
  value: any;
  className?: string;
}
