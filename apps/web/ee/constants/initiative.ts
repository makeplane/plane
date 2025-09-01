import { TCreateUpdateInitiativeModal } from "@plane/types";
import { TInitiativeGroupByOptions, TInitiativeOrderByOptions } from "../types/initiative";

export const DEFAULT_CREATE_UPDATE_INITIATIVE_MODAL_DATA: TCreateUpdateInitiativeModal = {
  isOpen: false,
  initiativeId: undefined,
};

export const INITIATIVE_GROUP_BY_OPTIONS: {
  key: TInitiativeGroupByOptions;
  title: string;
}[] = [
  { key: "lead", title: "Lead" },
  { key: "created_by", title: "Created By" },
  { key: undefined, title: "None" },
];

export const INITIATIVE_ORDER_BY_OPTIONS: {
  key: TInitiativeOrderByOptions;
  title: string;
}[] = [
  { key: "sort_order", title: "Manual" },
  { key: "-created_at", title: "Last Created" },
  { key: "-updated_at", title: "Last Updated" },
];
