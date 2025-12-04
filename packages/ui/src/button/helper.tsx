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
  | "tertiary-danger"
  | "link-neutral";

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
  sm = `px-3 py-1.5 font-medium text-11 rounded-sm flex items-center gap-1.5 whitespace-nowrap transition-all justify-center`,
  md = `px-4 py-1.5 font-medium text-13 rounded-sm flex items-center gap-1.5 whitespace-nowrap transition-all justify-center`,
  lg = `px-5 py-2 font-medium text-13 rounded-sm flex items-center gap-1.5 whitespace-nowrap transition-all justify-center`,
  xl = `px-5 py-3.5 font-medium text-13 rounded-sm flex items-center gap-1.5 whitespace-nowrap transition-all justify-center`,
}

enum buttonIconStyling {
  sm = "h-3 w-3 flex justify-center items-center overflow-hidden my-0.5 flex-shrink-0",
  md = "h-3.5 w-3.5 flex justify-center items-center overflow-hidden my-0.5 flex-shrink-0",
  lg = "h-4 w-4 flex justify-center items-center overflow-hidden my-0.5 flex-shrink-0",
  xl = "h-4 w-4 flex justify-center items-center overflow-hidden my-0.5 flex-shrink-0 ",
}

export const buttonStyling: IButtonStyling = {
  primary: {
    default: `text-white bg-accent-primary`,
    hover: `hover:bg-custom-primary-200`,
    pressed: `focus:text-custom-brand-40 focus:bg-custom-primary-200`,
    disabled: `cursor-not-allowed !bg-custom-primary-60 hover:bg-custom-primary-60`,
  },
  "accent-primary": {
    default: `bg-accent-primary/20 text-accent-primary`,
    hover: `hover:bg-accent-primary/10 hover:text-custom-primary-200`,
    pressed: `focus:bg-accent-primary/10`,
    disabled: `cursor-not-allowed !text-custom-primary-60`,
  },
  "outline-primary": {
    default: `text-accent-primary bg-transparent border border-accent-strong`,
    hover: `hover:bg-accent-primary/20`,
    pressed: `focus:text-accent-primary focus:bg-accent-primary/30`,
    disabled: `cursor-not-allowed !text-custom-primary-60 !border-custom-primary-60 `,
  },
  "neutral-primary": {
    default: `text-secondary bg-surface-1 border border-subtle-1`,
    hover: `hover:bg-surface-2`,
    pressed: `focus:text-tertiary focus:bg-surface-2`,
    disabled: `cursor-not-allowed !text-placeholder`,
  },
  "link-primary": {
    default: `text-accent-primary bg-surface-1`,
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
    default: `text-red-500 bg-transparent border border-red-500`,
    hover: `hover:text-red-400 hover:border-red-400`,
    pressed: `focus:text-red-400 focus:border-red-400`,
    disabled: `cursor-not-allowed !text-red-300 !border-red-300`,
  },
  "link-danger": {
    default: `text-red-500 bg-surface-1`,
    hover: `hover:text-red-400`,
    pressed: `focus:text-red-400`,
    disabled: `cursor-not-allowed !text-red-300`,
  },
  "tertiary-danger": {
    default: `text-red-500 bg-surface-1 border border-red-200`,
    hover: `hover:bg-red-50 hover:border-red-300`,
    pressed: `focus:text-red-400`,
    disabled: `cursor-not-allowed !text-red-300`,
  },
  "link-neutral": {
    default: `text-tertiary`,
    hover: `hover:text-secondary`,
    pressed: `focus:text-primary`,
    disabled: `cursor-not-allowed !text-placeholder`,
  },
};

export const getButtonStyling = (variant: TButtonVariant, size: TButtonSizes, disabled: boolean = false): string => {
  let tempVariant: string = ``;
  const currentVariant = buttonStyling[variant];

  tempVariant = `${currentVariant.default} ${disabled ? currentVariant.disabled : currentVariant.hover} ${
    currentVariant.pressed
  }`;

  let tempSize: string = ``;
  if (size) tempSize = buttonSizeStyling[size];
  return `${tempVariant} ${tempSize}`;
};

export const getIconStyling = (size: TButtonSizes): string => {
  let icon: string = ``;
  if (size) icon = buttonIconStyling[size];
  return icon;
};
