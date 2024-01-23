import { Placement } from "@popperjs/core";

export type TButtonVariants =
  | "border-with-text"
  | "border-without-text"
  | "background-with-text"
  | "background-without-text"
  | "transparent-with-text"
  | "transparent-without-text";

export type TDropdownProps = {
  buttonClassName?: string;
  buttonContainerClassName?: string;
  buttonVariant: TButtonVariants;
  className?: string;
  disabled?: boolean;
  placement?: Placement;
  tabIndex?: number;
};
