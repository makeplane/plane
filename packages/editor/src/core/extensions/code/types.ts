export enum ECodeBlockAttributeNames {
  ID = "id",
  LANGUAGE = "language",
}

export type TCodeBlockAttributes = {
  [ECodeBlockAttributeNames.ID]: string | null;
  [ECodeBlockAttributeNames.LANGUAGE]: string | null;
};
