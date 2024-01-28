import { ReactNode } from "react";
import { Placement } from "@popperjs/core";
import { TDropdownProps, TButtonVariants } from "../types";

type TModuleSelectDropdownRoot = Omit<
  TDropdownProps,
  "buttonClassName",
  "buttonContainerClassName",
  "buttonContainerClassName",
  "className",
  "disabled",
  "hideIcon",
  "placeholder",
  "placement",
  "tabIndex",
  "tooltip"
>;

export type TModuleSelectDropdownBase = {
  value: string | string[] | undefined;
  onChange: (moduleIds: undefined | string | (string | undefined)[]) => void;
  placeholder?: string;
  disabled?: boolean;
  buttonClassName?: string;
  buttonVariant?: TButtonVariants;
  hideIcon?: boolean;
  dropdownArrow?: boolean;
  dropdownArrowClassName?: string;
  showTooltip?: boolean;
  showCount?: boolean;
};

export type TModuleSelectButton = TModuleSelectDropdownBase & { hideText?: boolean };

export type TModuleSelectDropdown = TModuleSelectDropdownBase & {
  workspaceSlug: string;
  projectId: string;
  multiple?: boolean;
  className?: string;
  buttonContainerClassName?: string;
  placement?: Placement;
  tabIndex?: number;
  button?: ReactNode;
};

export type TModuleSelectDropdownOption = {
  value: string | undefined;
  query: string;
  content: JSX.Element;
};
