export enum ECardVariant {
  WITHOUT_SHADOW = "without-shadow",
  WITH_SHADOW = "with-shadow",
}
export enum ECardFlow {
  ROW = "row",
  COLUMN = "column",
}
export enum ECardSize {
  SM = "sm",
  LG = "lg",
}
export type TCardVariant = ECardVariant.WITHOUT_SHADOW | ECardVariant.WITH_SHADOW;
export type TCardFlow = ECardFlow.ROW | ECardFlow.COLUMN;
export type TCardSize = ECardSize.SM | ECardSize.LG;

export interface ICardProperties {
  [key: string]: string;
}

const DEFAULT_STYLE =
  "bg-custom-background-100 rounded-lg border-[0.5px] border-custom-border-200 w-full flex flex-col";
export const containerStyle: ICardProperties = {
  [ECardVariant.WITHOUT_SHADOW]: "",
  [ECardVariant.WITH_SHADOW]: "hover:shadow-custom-shadow-4xl duration-300",
};
export const sizes = {
  [ECardSize.SM]: "p-4",
  [ECardSize.LG]: "p-6",
};
export const flows = {
  [ECardFlow.ROW]: "flex-row space-x-3",
  [ECardFlow.COLUMN]: "flex-col space-y-3",
};
export const getCardStyle = (variant: TCardVariant, size: TCardSize, flow: TCardFlow) =>
  DEFAULT_STYLE + " " + flows[flow] + " " + containerStyle[variant] + " " + sizes[size];
