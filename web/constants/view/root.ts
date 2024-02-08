import { v4 as uuidV4 } from "uuid";
// types
import { TViewTypes, TView } from "@plane/types";

export const VIEW_TYPES: Record<TViewTypes, TViewTypes> = {
  WORKSPACE_PRIVATE_VIEWS: "WORKSPACE_PRIVATE_VIEWS",
  WORKSPACE_PUBLIC_VIEWS: "WORKSPACE_PUBLIC_VIEWS",
  PROJECT_PRIVATE_VIEWS: "PROJECT_PRIVATE_VIEWS",
  PROJECT_PUBLIC_VIEWS: "PROJECT_PUBLIC_VIEWS",
};

export const viewLocalPayload: Partial<TView> = {
  id: uuidV4(),
  name: "",
  description: "",
  filters: undefined,
  display_filters: undefined,
  display_properties: undefined,
  is_local_view: false,
  is_create: true,
};
