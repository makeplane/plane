import { Placement } from "@popperjs/core";

export type TPopoverButtonDefaultOptions = {
  // button and button styling
  button?: React.ReactNode;
  buttonClassName?: string;
  buttonRefClassName?: string;
  disabled?: boolean;
};

export type TPopoverDefaultOptions = TPopoverButtonDefaultOptions & {
  // popper styling
  popperPosition?: Placement | undefined;
  popperPadding?: number | undefined;
  // panel styling
  panelClassName?: string;
  popoverClassName?: string;
  popoverButtonRef?: React.RefObject<HTMLButtonElement | null>;
};

export type TPopover = TPopoverDefaultOptions & {
  // children
  children: React.ReactNode;
};

export type TPopoverMenu<T> = TPopoverDefaultOptions & {
  data: T[];
  keyExtractor: (item: T, index: number) => string;
  render: (item: T, index: number) => React.ReactNode;
};
