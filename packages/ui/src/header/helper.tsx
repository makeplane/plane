export type THeaderVariant = "primary" | "secondary" | "ternary";
export enum EHeaderVariant {
  primary = "primary",
  secondary = "secondary",
  ternary = "ternary",
}
export interface IHeaderProperties {
  [key: string]: string;
}
export const headerStyle: IHeaderProperties = {
  primary:
    "relative flex w-full flex-shrink-0 flex-row items-center justify-between gap-x-2 gap-y-4 bg-custom-sidebar-background-100",
  secondary: "block !py-0  overflow-y-hidden border-b border-custom-border-200",
  ternary: "flex justify-between py-2  border-b border-custom-border-200",
};
export const minHeights: IHeaderProperties = {
  primary: "",
  secondary: "min-h-[52px]",
  ternary: "",
};
export const getHeaderStyle = (variant: THeaderVariant, setMinHeight: boolean) => {
  const height = setMinHeight ? minHeights[variant] : "";
  return headerStyle[variant] + " " + height;
};
