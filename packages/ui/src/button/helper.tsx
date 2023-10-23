export type TButtonVariant =
  | "primary"
  | "accent-primary"
  | "outline-primary"
  | "neutral-primary"
  | "link-primary"
  | "danger"
  | "accent-danger"
  | "outline-danger"
  | "link-danger"
  | "tertiary-danger";

export type TButtonSizes = "sm" | "md" | "lg" | "xl";

export interface IButtonStyling {
  [key: string]: {
    default: string;
    hover: string;
    pressed: string;
    disabled: string;
  };
}

enum buttonSizeStyling {
  sm = `px-3 py-1.5 font-medium text-xs rounded flex items-center gap-1.5 whitespace-nowrap transition-all justify-center inline`,
  md = `px-4 py-1.5 font-medium text-sm rounded flex items-center gap-1.5 whitespace-nowrap transition-all justify-center inline`,
  lg = `px-5 py-2 font-medium text-sm rounded flex items-center gap-1.5 whitespace-nowrap transition-all justify-center inline`,
  xl = `px-5 py-3.5 font-medium text-sm rounded flex items-center gap-1.5 whitespace-nowrap transition-all justify-center inline`,
}

enum buttonIconStyling {
  sm = "h-3 w-3 flex justify-center items-center overflow-hidden my-0.5 flex-shrink-0",
  md = "h-3.5 w-3.5 flex justify-center items-center overflow-hidden my-0.5 flex-shrink-0",
  lg = "h-4 w-4 flex justify-center items-center overflow-hidden my-0.5 flex-shrink-0",
  xl = "h-4 w-4 flex justify-center items-center overflow-hidden my-0.5 flex-shrink-0",
}

export const buttonStyling: IButtonStyling = {
  primary: {
    default: `text-white bg-custom-primary-100`,
    hover: `hover:bg-custom-primary-200`,
    pressed: `focus:text-custom-brand-40 focus:bg-custom-primary-200`,
    disabled: `cursor-not-allowed !bg-custom-primary-60 hover:bg-custom-primary-60`,
  },
  "accent-primary": {
    default: `bg-custom-primary-10 text-custom-primary-100`,
    hover: `hover:bg-custom-primary-20 hover:text-custom-primary-200`,
    pressed: `focus:bg-custom-primary-20`,
    disabled: `cursor-not-allowed !text-custom-primary-60`,
  },
  "outline-primary": {
    default: `text-custom-primary-100 bg-custom-background-100 border border-custom-primary-100`,
    hover: `hover:border-custom-primary-80 hover:bg-custom-primary-10`,
    pressed: `focus:text-custom-primary-80 focus:bg-custom-primary-10 focus:border-custom-primary-80`,
    disabled: `cursor-not-allowed !text-custom-primary-60 !border-custom-primary-60 `,
  },
  "neutral-primary": {
    default: `text-custom-text-200 bg-custom-background-100 border border-custom-border-200`,
    hover: `hover:bg-custom-background-90`,
    pressed: `focus:text-custom-text-300 focus:bg-custom-background-90`,
    disabled: `cursor-not-allowed !text-custom-text-400`,
  },
  "link-primary": {
    default: `text-custom-primary-100 bg-custom-background-100`,
    hover: `hover:text-custom-primary-200`,
    pressed: `focus:text-custom-primary-80 `,
    disabled: `cursor-not-allowed !text-custom-primary-60`,
  },

  danger: {
    default: `text-white bg-red-500`,
    hover: ` hover:bg-red-600`,
    pressed: `focus:text-red-200 focus:bg-red-600`,
    disabled: `cursor-not-allowed !bg-red-300`,
  },
  "accent-danger": {
    default: `text-red-500 bg-red-50`,
    hover: `hover:text-red-600 hover:bg-red-100`,
    pressed: `focus:text-red-500 focus:bg-red-100`,
    disabled: `cursor-not-allowed !text-red-300`,
  },
  "outline-danger": {
    default: `text-red-500 bg-custom-background-100 border border-red-500`,
    hover: `hover:text-red-400 hover:border-red-400`,
    pressed: `focus:text-red-400 focus:border-red-400`,
    disabled: `cursor-not-allowed !text-red-300 !border-red-300`,
  },
  "link-danger": {
    default: `text-red-500 bg-custom-background-100`,
    hover: `hover:text-red-400`,
    pressed: `focus:text-red-400`,
    disabled: `cursor-not-allowed !text-red-300`,
  },
  "tertiary-danger": {
    default: `text-red-500 bg-custom-background-100 border border-red-200`,
    hover: `hover:bg-red-50 hover:border-red-300`,
    pressed: `focus:text-red-400`,
    disabled: `cursor-not-allowed !text-red-300`,
  },
};

export const getButtonStyling = (
  variant: TButtonVariant,
  size: TButtonSizes,
  disabled: boolean = false
): string => {
  let _variant: string = ``;
  const currentVariant = buttonStyling[variant];

  _variant = `${currentVariant.default} ${
    disabled ? currentVariant.disabled : currentVariant.hover
  } ${currentVariant.pressed}`;

  let _size: string = ``;
  if (size) _size = buttonSizeStyling[size];
  return `${_variant} ${_size}`;
};

export const getIconStyling = (size: TButtonSizes): string => {
  let icon: string = ``;
  if (size) icon = buttonIconStyling[size];
  return icon;
};
