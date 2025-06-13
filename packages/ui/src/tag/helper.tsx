export const ETagVariant = {
  OUTLINED: "outlined",
} as const;

export type ETagVariant = typeof ETagVariant[keyof typeof ETagVariant];

export const ETagSize = {
  SM: "sm",
  LG: "lg",
} as const;

export type ETagSize = typeof ETagSize[keyof typeof ETagSize];

export type TTagVariant = typeof ETagVariant.OUTLINED;

export type TTagSize = typeof ETagSize.SM | typeof ETagSize.LG;
export interface ITagProperties {
  [key: string]: string;
}

export const containerStyle: ITagProperties = {
  [ETagVariant.OUTLINED]:
    "flex items-center rounded-md border border-custom-border-200 text-xs text-custom-text-300 hover:text-custom-text-200 min-h-[36px] my-auto capitalize flex-wrap cursor-pointer gap-1.5",
};
export const sizes = {
  [ETagSize.SM]: "p-1.5",
  [ETagSize.LG]: "p-6",
};

export const getTagStyle = (variant: TTagVariant, size: TTagSize) => containerStyle[variant] + " " + sizes[size];
