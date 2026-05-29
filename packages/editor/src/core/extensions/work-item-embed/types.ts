export enum EWorkItemEmbedAttributeNames {
  ID = "id",
  ENTITY_IDENTIFIER = "entity_identifier",
  PROJECT_IDENTIFIER = "project_identifier",
  WORKSPACE_IDENTIFIER = "workspace_identifier",
  ENTITY_NAME = "entity_name",
}

export type TWorkItemEmbedAttributes = {
  [EWorkItemEmbedAttributeNames.ID]: string | undefined;
  [EWorkItemEmbedAttributeNames.ENTITY_IDENTIFIER]: string | undefined;
  [EWorkItemEmbedAttributeNames.PROJECT_IDENTIFIER]: string | undefined;
  [EWorkItemEmbedAttributeNames.WORKSPACE_IDENTIFIER]: string | undefined;
  [EWorkItemEmbedAttributeNames.ENTITY_NAME]: string | undefined;
};
