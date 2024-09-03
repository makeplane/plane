export enum EHeaderVariant {
  PRIMARY = "primary",
  SECONDARY = "secondary",
  TERNARY = "ternary",
}
export type THeaderVariant = EHeaderVariant.PRIMARY | EHeaderVariant.SECONDARY | EHeaderVariant.TERNARY;

export interface IHeaderProperties {
  [key: string]: string;
}
export const headerStyle: IHeaderProperties = {
  [EHeaderVariant.PRIMARY]:
    "relative flex w-full flex-shrink-0 flex-row items-center justify-between gap-x-2 gap-y-4 bg-custom-sidebar-background-100",
  [EHeaderVariant.SECONDARY]: "block !py-0  overflow-y-hidden border-b border-custom-border-200",
  [EHeaderVariant.TERNARY]: "flex justify-between py-2  border-b border-custom-border-200",
};
export const minHeights: IHeaderProperties = {
  [EHeaderVariant.PRIMARY]: "",
  [EHeaderVariant.SECONDARY]: "min-h-[52px]",
  [EHeaderVariant.TERNARY]: "",
};
export const getHeaderStyle = (variant: THeaderVariant, setMinHeight: boolean) => {
  const height = setMinHeight ? minHeights[variant] : "";
  return headerStyle[variant] + " " + height;
};
