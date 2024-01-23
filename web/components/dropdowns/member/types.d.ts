import { TDropdownProps } from "../types";

export type MemberDropdownProps = TDropdownProps & {
  button?: ReactNode;
  dropdownArrow?: boolean;
  placeholder?: string;
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
