import { Placement } from "@popperjs/core";

export type DropdownProps = {
  customButtonClassName?: string;
  buttonClassName?: string;
  customButtonClassName?: string;
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
};
