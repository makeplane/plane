import type { TBlockNodeBaseAttributes } from "../unique-id/types";

export type TWorkItemEmbedAttributes = TBlockNodeBaseAttributes & {
  entity_identifier: string | undefined;
  project_identifier: string | undefined;
  workspace_identifier: string | undefined;
  entity_name: string | undefined;
};
