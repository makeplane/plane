export type TButtonVariant =
  | "primary"
  | "surface-primary"
  | "outline-primary"
  | "text-primary"
  | "surface-neutral"
  | "outline-neutral"
  | "text-neutral"
  | "warning"
  | "danger";

export type TButtonSizes = "sm" | "md" | "lg" | "xl";

export type TButtonStyling = {
  [key in TButtonVariant]: {
    default: string;
    hover: string;
    pressed: string;
    disabled: string;
  };
};

enum buttonSizeStyling {
  sm = `px-3 py-1.5 font-medium text-xs rounded flex items-center gap-1.5 whitespace-nowrap transition-all justify-center`,
  md = `px-4 py-1.5 font-medium text-sm rounded flex items-center gap-1.5 whitespace-nowrap transition-all justify-center`,
  lg = `px-5 py-2 font-medium text-sm rounded flex items-center gap-1.5 whitespace-nowrap transition-all justify-center`,
  xl = `px-5 py-3.5 font-medium text-sm rounded flex items-center gap-1.5 whitespace-nowrap transition-all justify-center`,
}

enum buttonIconStyling {
  sm = "h-3 w-3 flex justify-center items-center overflow-hidden my-0.5 flex-shrink-0",
  md = "h-3.5 w-3.5 flex justify-center items-center overflow-hidden my-0.5 flex-shrink-0",
  lg = "h-4 w-4 flex justify-center items-center overflow-hidden my-0.5 flex-shrink-0",
  xl = "h-4 w-4 flex justify-center items-center overflow-hidden my-0.5 flex-shrink-0",
}

export const buttonStyling: TButtonStyling = {
  primary: {
    default: `text-white bg-primary-solid`,
    hover: `hover:bg-primary-solid-hover`,
    pressed: `focus:bg-primary-solid-hover focus:ring-2 focus:ring-primary-border-medium`,
    disabled: `cursor-not-allowed bg-neutral-component-surface-dark text-neutral-text-subtle`,
  },
  "surface-primary": {
    default: `bg-primary-component-surface-light text-primary-text-subtle`,
    hover: `hover:bg-primary-component-surface-medium`,
    pressed: `focus:bg-primary-component-surface-dark focus:ring-2 focus:ring-primary-border-medium focus:text-neutral-text-medium`,
    disabled: `cursor-not-allowed bg-neutral-component-surface-dark text-neutral-text-subtle`,
  },
  "outline-primary": {
    default: `text-primary-text-subtle bg-transparent border border-primary-border-subtle`,
    hover: `hover:bg-primary-component-surface-medium hover:border-primary-border-medium`,
    pressed: `focus:bg-primary-component-surface-dark focus:ring-1 focus:ring-primary-border-medium`,
    disabled: `cursor-not-allowed border-transparent bg-neutral-component-surface-dark text-neutral-text-subtle`,
  },
  "text-primary": {
    default: `text-primary-text-subtle bg-transparent`,
    hover: `hover:bg-primary-component-surface-light`,
    pressed: `focus:bg-primary-component-surface-medium`,
    disabled: `cursor-not-allowed bg-neutral-component-surface-dark text-neutral-text-subtle`,
  },
  "surface-neutral": {
    default: `bg-neutral-component-surface-light text-neutral-text-subtle`,
    hover: `hover:bg-neutral-component-surface-medium`,
    pressed: `focus:bg-neutral-component-surface-dark focus:ring-2 focus:ring-neutral-border-medium focus:text-neutral-text-medium`,
    disabled: `cursor-not-allowed bg-neutral-component-surface-dark text-neutral-text-subtle`,
  },
  "outline-neutral": {
    default: `text-neutral-text-subtle bg-transparent border border-neutral-border-subtle`,
    hover: `hover:bg-neutral-component-surface-medium hover:border-neutral-border-medium`,
    pressed: `focus:bg-neutral-component-surface-dark focus:ring-1 focus:ring-neutral-border-medium`,
    disabled: `cursor-not-allowed border-transparent bg-neutral-component-surface-dark text-neutral-text-subtle`,
  },
  "text-neutral": {
    default: `text-neutral-text-subtle bg-transparent`,
    hover: `hover:bg-neutral-component-surface-light`,
    pressed: `focus:bg-neutral-component-surface-medium`,
    disabled: `cursor-not-allowed bg-neutral-component-surface-dark text-neutral-text-subtle`,
  },
  warning: {
    default: `text-white bg-warning-solid`,
    hover: `hover:bg-warning-solid-hover`,
    pressed: `focus:bg-warning-solid-hover focus:ring-2 focus:ring-warning-border-medium`,
    disabled: `cursor-not-allowed bg-neutral-component-surface-dark text-neutral-text-subtle`,
  },
  danger: {
    default: `text-white bg-danger-solid`,
    hover: ` hover:bg-danger-solid-hover`,
    pressed: `focus:bg-danger-solid-hover focus:ring-2 focus:ring-danger-border-medium`,
    disabled: `cursor-not-allowed bg-neutral-component-surface-dark text-neutral-text-subtle`,
  },
};

export const getButtonStyling = (variant: TButtonVariant, size: TButtonSizes, disabled: boolean = false): string => {
  let _variant: string = ``;
  const currentVariant = buttonStyling[variant];

  _variant = `${currentVariant.default} ${disabled ? currentVariant.disabled : currentVariant.hover} ${
    currentVariant.pressed
  }`;

  let _size: string = ``;
  if (size) _size = buttonSizeStyling[size];
  return `${_variant} ${_size}`;
};

export const getIconStyling = (size: TButtonSizes): string => {
  let icon: string = ``;
  if (size) icon = buttonIconStyling[size];
  return icon;
};
