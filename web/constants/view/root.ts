import { v4 as uuidV4 } from "uuid";
// types
import { TViewTypes, TView } from "@plane/types";

export const VIEW_TYPES: Record<TViewTypes, TViewTypes> = {
  WORKSPACE_YOUR_VIEWS: "WORKSPACE_YOUR_VIEWS",
  WORKSPACE_VIEWS: "WORKSPACE_VIEWS",
  PROJECT_VIEWS: "PROJECT_VIEWS",
  PROJECT_YOUR_VIEWS: "PROJECT_YOUR_VIEWS",
};

export const viewLocalPayload: Partial<TView> = {
  id: uuidV4(),
  name: "",
  description: "",
  filters: {},
  display_filters: {},
  display_properties: {},
  is_local_view: false,
  is_create: true,
};
