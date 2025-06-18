import { TAddWorkspaceSeatsModal } from "@plane/types";
import { EProductSubscriptionEnum } from "./payment";

// Product subscription tiers
export enum EProductSubscriptionTier {
  FREE = 0,
  ONE = 5,
  PRO = 10,
  BUSINESS = 20,
  ENTERPRISE = 30,
}

export const DEFAULT_ADD_WORKSPACE_SEATS_MODAL_DATA: TAddWorkspaceSeatsModal = {
  isOpen: false,
};

/**
 * Subscription types that support trial periods
 */
export const SUBSCRIPTION_WITH_TRIAL = [EProductSubscriptionEnum.BUSINESS];

/**
 * Subscription types that support seats management
 */
export const SUBSCRIPTION_WITH_SEATS_MANAGEMENT = [
  EProductSubscriptionEnum.PRO,
  EProductSubscriptionEnum.BUSINESS,
  EProductSubscriptionEnum.ENTERPRISE,
];
