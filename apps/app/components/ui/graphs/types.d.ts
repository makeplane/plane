import { Theme, Margin } from "@nivo/core";

export type TGraph = {
  height?: string;
  width?: string;
  margin?: Partial<Margin>;
  colors?: { [key: string]: string };
  tooltip?: (datum: { id: string | number; value: number; color: string }) => JSX.Element;
  theme?: Theme;
};
