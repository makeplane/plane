export type TRowVariant = "regular" | "hugging";
export enum ERowVariant {
  regular = "regular",
  hugging = "hugging",
}
export interface IRowProperties {
  [key: string]: string;
}
export const rowStyle: IRowProperties = {
  regular: "px-page-x",
  hugging: "px-0 py-0",
};
