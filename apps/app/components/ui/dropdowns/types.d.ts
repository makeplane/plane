export type DropdownProps = {
  buttonClassName?: string;
  className?: string;
  customButton?: JSX.Element;
  disabled?: boolean;
  input?: boolean;
  label?: string | JSX.Element;
  maxHeight?: "sm" | "rg" | "md" | "lg";
  noChevron?: boolean;
  optionsClassName?: string;
  position?: "right" | "left";
  selfPositioned?: boolean;
  verticalPosition?: "top" | "bottom";
  width?: "auto" | string;
};
