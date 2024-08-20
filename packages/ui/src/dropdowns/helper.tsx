// FIXME: fix this!!!
import { Placement } from "@blueprintjs/popover2";

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
  onOpen?: () => void;
  optionsClassName?: string;
  placement?: Placement;
  tabIndex?: number;
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
  options:
    | {
        value: any;
        query: string;
        content: React.ReactNode;
      }[]
    | undefined;
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
