import { Placement } from "@popperjs/core";
import { TButtonVariants } from "../types";

export type MemberDropdownProps = {
  button?: ReactNode;
  buttonClassName?: string;
  buttonContainerClassName?: string;
  buttonVariant: TButtonVariants;
  className?: string;
  disabled?: boolean;
  dropdownArrow?: boolean;
  placeholder?: string;
  placement?: Placement;
  tabIndex?: number;
} & (
  | {
      multiple: false;
      onChange: (val: string | null) => void;
      value: string | null;
    }
  | {
      multiple: true;
      onChange: (val: string[]) => void;
      value: string[];
    }
);
