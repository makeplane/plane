import { Placement } from "@popperjs/core";

export interface IDropdown {
  // root props
  onOpen?: () => void;
  onClose?: () => void;
  containerClassName?: (isOpen: boolean) => string;
  tabIndex?: number;
  placement?: Placement;
  disabled?: boolean;

  // button props
  buttonContent?: (isOpen: boolean, value: string | string[] | undefined) => React.ReactNode;
  buttonContainerClassName?: string;
  buttonClassName?: string;

  // input props
  disableSearch?: boolean;
  inputPlaceholder?: string;
  inputClassName?: string;
  inputIcon?: React.ReactNode;
  inputContainerClassName?: string;

  // options props
  keyExtractor: (option: TDropdownOption) => string;
  optionsContainerClassName?: string;
  queryArray?: string[];
  sortByKey?: string;
  firstItem?: (optionValue: string) => boolean;
  renderItem?: ({ value, selected }: { value: string; selected: boolean }) => React.ReactNode;
  loader?: React.ReactNode;
  disableSorting?: boolean;
}

export interface TDropdownOption {
  data: any;
  value: string;
  className?: ({ active, selected }: { active: boolean; selected: boolean }) => string;
}

export interface IMultiSelectDropdown extends IDropdown {
  value: string[];
  onChange: (value: string[]) => void;
  options: TDropdownOption[] | undefined;
}

export interface ISingleSelectDropdown extends IDropdown {
  value: string;
  onChange: (value: string) => void;
  options: TDropdownOption[] | undefined;
}

export interface IDropdownButton {
  isOpen: boolean;
  buttonContent?: (isOpen: boolean, value: string | string[] | undefined) => React.ReactNode;
  buttonClassName?: string;
  buttonContainerClassName?: string;
  handleOnClick: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  setReferenceElement: (element: HTMLButtonElement | null) => void;
  disabled?: boolean;
}

export interface IMultiSelectDropdownButton extends IDropdownButton {
  value: string[];
}

export interface ISingleSelectDropdownButton extends IDropdownButton {
  value: string;
}

export interface IDropdownOptions {
  isOpen: boolean;
  query: string;
  setQuery: (query: string) => void;

  inputPlaceholder?: string;
  inputClassName?: string;
  inputIcon?: React.ReactNode;
  inputContainerClassName?: string;
  disableSearch?: boolean;

  handleClose?: () => void;

  keyExtractor: (option: TDropdownOption) => string;
  renderItem: (({ value, selected }: { value: string; selected: boolean }) => React.ReactNode) | undefined;
  options: TDropdownOption[] | undefined;
  loader?: React.ReactNode;
}

export interface IMultiSelectDropdownOptions extends IDropdownOptions {
  value: string[];
}

export interface ISingleSelectDropdownOptions extends IDropdownOptions {
  value: string;
}
