export type TDropdownOptions<T> = {
  key: string;
  label: string;
  value: string;
  data?: T;
};

export type TDropdown<T> = {
  dropdownOptions: TDropdownOptions<T>[];
  onChange: (value: string | undefined) => void;
  value: string | undefined;
  placeHolder?: string;
  disabled?: boolean;
  iconExtractor?: (option: T) => JSX.Element;
  queryExtractor?: (option: T) => string;
};
