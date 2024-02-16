// types
import { TViewTypes, TView } from "@plane/types";

export const VIEW_TYPES: Record<TViewTypes, TViewTypes> = {
  WORKSPACE_PRIVATE_VIEWS: "WORKSPACE_PRIVATE_VIEWS",
  WORKSPACE_PUBLIC_VIEWS: "WORKSPACE_PUBLIC_VIEWS",
  PROJECT_PRIVATE_VIEWS: "PROJECT_PRIVATE_VIEWS",
  PROJECT_PUBLIC_VIEWS: "PROJECT_PUBLIC_VIEWS",
};

export type TViewCRUD = "CREATE" | "EDIT" | "SAVE_AS_NEW" | "CLEAR";

export const viewLocalPayload: Partial<TView> = {
  id: "create",
  name: "",
  description: "",
  filters: undefined,
  display_filters: undefined,
  display_properties: undefined,
  is_local_view: false,
};

export const generateViewStoreKey = (
  workspaceSlug: string,
  projectId: string | undefined,
  viewType: TViewTypes
): string => `${workspaceSlug}_${projectId}_${viewType}`;
