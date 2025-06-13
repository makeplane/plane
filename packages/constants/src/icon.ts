export const EIconSize = {
  XS: "xs",
  SM: "sm",
  MD: "md",
  LG: "lg",
  XL: "xl",
} as const;

export type EIconSize = typeof EIconSize[keyof typeof EIconSize];
