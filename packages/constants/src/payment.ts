import { TAddWorkspaceSeatsModal } from "@plane/types";

// Product subscription tiers
export enum EProductSubscriptionTier {
  FREE = 0,
  ONE = 5,
  PRO = 10,
  BUSINESS = 20,
  ENTERPRISE = 30,
}

export enum EProductSubscriptionEnum {
  FREE = "FREE",
  ONE = "ONE",
  PRO = "PRO",
  BUSINESS = "BUSINESS",
  ENTERPRISE = "ENTERPRISE",
}

export const DEFAULT_ADD_WORKSPACE_SEATS_MODAL_DATA: TAddWorkspaceSeatsModal = {
  isOpen: false,
};
