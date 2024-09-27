export type TBadgeVariant =
  | "primary"
  | "accent-primary"
  | "outline-primary"
  | "neutral"
  | "accent-neutral"
  | "outline-neutral"
  | "success"
  | "accent-success"
  | "outline-success"
  | "warning"
  | "accent-warning"
  | "outline-warning"
  | "destructive"
  | "accent-destructive"
  | "outline-destructive";

export type TBadgeSizes = "sm" | "md" | "lg" | "xl";

export interface IBadgeStyling {
  [key: string]: {
    default: string;
    hover: string;
    disabled: string;
  };
}

// TODO: convert them to objects instead of enums
enum badgeSizeStyling {
  sm = `px-2.5 py-1 font-medium text-xs rounded flex items-center gap-1.5 whitespace-nowrap transition-all justify-center inline`,
  md = `px-4 py-1.5 font-medium text-sm rounded flex items-center gap-1.5 whitespace-nowrap transition-all justify-center inline`,
  lg = `px-4 py-2 font-medium text-sm rounded flex items-center gap-1.5 whitespace-nowrap transition-all justify-center inline`,
  xl = `px-5 py-3 font-medium text-sm rounded flex items-center gap-1.5 whitespace-nowrap transition-all justify-center inline`,
}

// TODO: convert them to objects instead of enums
enum badgeIconStyling {
  sm = "h-3 w-3 flex justify-center items-center overflow-hidden flex-shrink-0",
  md = "h-3.5 w-3.5 flex justify-center items-center overflow-hidden flex-shrink-0",
  lg = "h-4 w-4 flex justify-center items-center overflow-hidden flex-shrink-0",
  // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
  xl = "h-4 w-4 flex justify-center items-center overflow-hidden flex-shrink-0",
}

export const badgeStyling: IBadgeStyling = {
  primary: {
    default: `text-white bg-custom-primary-100`,
    hover: `hover:bg-custom-primary-200`,
    disabled: `cursor-not-allowed !bg-custom-primary-60 hover:bg-custom-primary-60`,
  },
  "accent-primary": {
    default: `bg-custom-primary-10 text-custom-primary-100`,
    hover: `hover:bg-custom-primary-20 hover:text-custom-primary-200`,
    disabled: `cursor-not-allowed !text-custom-primary-60`,
  },
  "outline-primary": {
    default: `text-custom-primary-100 bg-custom-background-100 border border-custom-primary-100`,
    hover: `hover:border-custom-primary-80 hover:bg-custom-primary-10`,
    disabled: `cursor-not-allowed !text-custom-primary-60 !border-custom-primary-60 `,
  },

  neutral: {
    default: `text-custom-background-100 bg-custom-text-100 border border-custom-border-200`,
    hover: `hover:bg-custom-text-200`,
    disabled: `cursor-not-allowed bg-custom-border-200 !text-custom-text-400`,
  },
  "accent-neutral": {
    default: `text-custom-text-200 bg-custom-background-80`,
    hover: `hover:bg-custom-border-200 hover:text-custom-text-100`,
    disabled: `cursor-not-allowed !text-custom-text-400`,
  },
  "outline-neutral": {
    default: `text-custom-text-200 bg-custom-background-100 border border-custom-border-200`,
    hover: `hover:text-custom-text-100 hover:bg-custom-border-200`,
    disabled: `cursor-not-allowed !text-custom-text-400`,
  },

  success: {
    default: `text-white bg-green-500`,
    hover: `hover:bg-green-600`,
    disabled: `cursor-not-allowed !bg-green-300`,
  },
  "accent-success": {
    default: `text-green-500 bg-green-50`,
    hover: `hover:bg-green-100 hover:text-green-600`,
    disabled: `cursor-not-allowed !text-green-300`,
  },
  "outline-success": {
    default: `text-green-500 bg-custom-background-100 border border-green-500`,
    hover: `hover:text-green-600 hover:bg-green-50`,
    disabled: `cursor-not-allowed !text-green-300 border-green-300`,
  },

  warning: {
    default: `text-white bg-amber-500`,
    hover: `hover:bg-amber-600`,
    disabled: `cursor-not-allowed !bg-amber-300`,
  },
  "accent-warning": {
    default: `text-amber-500 bg-amber-50`,
    hover: `hover:bg-amber-100 hover:text-amber-600`,
    disabled: `cursor-not-allowed !text-amber-300`,
  },
  "outline-warning": {
    default: `text-amber-500 bg-custom-background-100 border border-amber-500`,
    hover: `hover:text-amber-600 hover:bg-amber-50`,
    disabled: `cursor-not-allowed !text-amber-300 border-amber-300`,
  },

  destructive: {
    default: `text-white bg-red-500`,
    hover: `hover:bg-red-600`,
    disabled: `cursor-not-allowed !bg-red-300`,
  },
  "accent-destructive": {
    default: `text-red-500 bg-red-50`,
    hover: `hover:bg-red-100 hover:text-red-600`,
    disabled: `cursor-not-allowed !text-red-300`,
  },
  "outline-destructive": {
    default: `text-red-500 bg-custom-background-100 border border-red-500`,
    hover: `hover:text-red-600 hover:bg-red-50`,
    disabled: `cursor-not-allowed !text-red-300 border-red-300`,
  },
};

export const getBadgeStyling = (variant: TBadgeVariant, size: TBadgeSizes, disabled: boolean = false): string => {
  let tempVariant: string = ``;
  const currentVariant = badgeStyling[variant];

  tempVariant = `${currentVariant.default} ${disabled ? currentVariant.disabled : currentVariant.hover}`;

  let tempSize: string = ``;
  if (size) tempSize = badgeSizeStyling[size];
  return `${tempVariant} ${tempSize}`;
};

export const getIconStyling = (size: TBadgeSizes): string => {
  let icon: string = ``;
  if (size) icon = badgeIconStyling[size];
  return icon;
};
