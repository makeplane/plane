export type TContainerVariant = "outlined" | "with-shadow";

export type TContainerSize = "sm" | "lg";
export interface IContainerProperties {
  [key: string]: string;
}

export enum EContainerVariant {
  "outlined" = "outlined",
  "shadow" = "with-shadow",
}
export enum EContainerSize {
  sm = "sm",
  lg = "lg",
}
export const containerStyle: IContainerProperties = {
  outlined:
    "flex items-center gap-2 rounded-md border border-custom-border-200 text-xs text-custom-text-300 hover:text-custom-text-200 min-h-[36px] my-auto capitalize flex-wrap cursor-pointer",
  "with-shadow":
    "bg-custom-background-100 rounded-xl border-[0.5px] border-custom-border-200 w-full p-0.5 hover:shadow-custom-shadow-4xl duration-300 flex",
};
export const sizes = {
  sm: "p-1.5",
  lg: "p-6",
};

export const getContainerStyle = (variant: TContainerVariant, size: TContainerSize) =>
  containerStyle[variant] + " " + sizes[size];
