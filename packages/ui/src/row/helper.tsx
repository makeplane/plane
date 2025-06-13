export const ERowVariant = {
  REGULAR: "regular",
  HUGGING: "hugging",
} as const;

export type ERowVariant = typeof ERowVariant[keyof typeof ERowVariant];

export type TRowVariant = typeof ERowVariant.REGULAR | typeof ERowVariant.HUGGING;
export interface IRowProperties {
  [key: string]: string;
}
export const rowStyle: IRowProperties = {
  [ERowVariant.REGULAR]: "px-page-x",
  [ERowVariant.HUGGING]: "px-0",
};
