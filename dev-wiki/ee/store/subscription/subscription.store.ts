/* eslint-disable no-useless-catch */
import set from "lodash/set";
import { action, computed, makeObservable, observable, reaction, runInAction } from "mobx";
// plane imports
import { DEFAULT_ADD_WORKSPACE_SEATS_MODAL_DATA } from "@plane/constants";
import { EProductSubscriptionEnum, IWorkspaceProductSubscription, TAddWorkspaceSeatsModal } from "@plane/types";
// services
import { PaymentService } from "@/plane-web/services/payment.service";
// plane web store
import { RootStore } from "@/plane-web/store/root.store";

const paymentService = new PaymentService();

type TWorkspaceSubscriptionMap = {
  [workspaceSlug: string]: IWorkspaceProductSubscription;
};

export interface IWorkspaceSubscriptionStore {
  // observables
  subscribedPlan: TWorkspaceSubscriptionMap;
  isPaidPlanModalOpen: boolean;
  isSuccessPlanModalOpen: boolean;
  addWorkspaceSeatsModal: TAddWorkspaceSeatsModal;
  removeUnusedSeatsConfirmationModal: boolean;
  // computed
  currentWorkspaceSubscribedPlanDetail: IWorkspaceProductSubscription | undefined;
  currentWorkspaceSubscriptionAvailableSeats: number;
  // helper actions
  togglePaidPlanModal: (value?: boolean) => void;
  toggleAddWorkspaceSeatsModal: (value?: TAddWorkspaceSeatsModal) => void;
  toggleRemoveUnusedSeatsConfirmationModal: () => void;
  handleSuccessModalToggle: (isOpen?: boolean) => void;
  // actions
  updateSubscribedPlan: (workspaceSlug: string, payload: Partial<IWorkspaceProductSubscription>) => void;
  fetchWorkspaceSubscribedPlan: (workspaceSlug: string) => Promise<IWorkspaceProductSubscription>;
  refreshWorkspaceSubscribedPlan: (workspaceSlug: string) => Promise<void>;
  freeTrialSubscription: (workspaceSlug: string, payload: { product_id: string; price_id: string }) => Promise<void>;
  cancelFreeTrial: (workspaceSlug: string) => Promise<void>;
}

export class WorkspaceSubscriptionStore implements IWorkspaceSubscriptionStore {
  // observables
  // workspace subscribed plan
  subscribedPlan: TWorkspaceSubscriptionMap = {};
  // modals
  isPaidPlanModalOpen = false;
  isSuccessPlanModalOpen: boolean = false;
  addWorkspaceSeatsModal: TAddWorkspaceSeatsModal = DEFAULT_ADD_WORKSPACE_SEATS_MODAL_DATA;
  removeUnusedSeatsConfirmationModal: boolean = false;

  constructor(private rootStore: RootStore) {
    makeObservable(this, {
      // observables
      subscribedPlan: observable,
      isPaidPlanModalOpen: observable.ref,
      isSuccessPlanModalOpen: observable,
      addWorkspaceSeatsModal: observable,
      removeUnusedSeatsConfirmationModal: observable,
      // computed
      currentWorkspaceSubscribedPlanDetail: computed,
      currentWorkspaceSubscriptionAvailableSeats: computed,
      // helper actions
      togglePaidPlanModal: action,
      handleSuccessModalToggle: action,
      toggleAddWorkspaceSeatsModal: action,
      toggleRemoveUnusedSeatsConfirmationModal: action,
      // actions
      updateSubscribedPlan: action,
      fetchWorkspaceSubscribedPlan: action,
      refreshWorkspaceSubscribedPlan: action,
      freeTrialSubscription: action,
      cancelFreeTrial: action,
    });
    // Reactions to fetch current plan details when workspace members change
    reaction(
      () => ({
        workspaceMemberIds: this.rootStore.memberRoot.workspace.workspaceMemberIds,
        workspaceMemberInvitationIds: this.rootStore.memberRoot.workspace.workspaceMemberInvitationIds,
      }),
      ({ workspaceMemberIds, workspaceMemberInvitationIds }) => {
        const workspaceSlug = this.rootStore.router.workspaceSlug;
        if (!workspaceSlug || !workspaceMemberIds || !workspaceMemberInvitationIds) return;
        if (
          this.currentWorkspaceSubscribedPlanDetail?.occupied_seats ===
          workspaceMemberIds.length + workspaceMemberInvitationIds.length
        )
          return;
        this.fetchWorkspaceSubscribedPlan(workspaceSlug);
      }
    );
  }

  // --------------- Computed ---------------
  /**
   * Get the current workspace subscribed plan detail
   * @returns IWorkspaceProductSubscription | undefined
   */
  get currentWorkspaceSubscribedPlanDetail() {
    if (!this.rootStore.router.workspaceSlug) return undefined;
    return this.subscribedPlan[this.rootStore.router.workspaceSlug] || undefined;
  }

  /**
   * Get the current workspace subscription available seats
   * @returns number
   */
  get currentWorkspaceSubscriptionAvailableSeats() {
    if (this.currentWorkspaceSubscribedPlanDetail?.product === EProductSubscriptionEnum.FREE) {
      return (
        (this.currentWorkspaceSubscribedPlanDetail.free_seats || 12) -
        (this.currentWorkspaceSubscribedPlanDetail.occupied_seats || 0)
      );
    } else {
      return (
        (this.currentWorkspaceSubscribedPlanDetail?.purchased_seats || 12) -
        (this.currentWorkspaceSubscribedPlanDetail?.billable_members || 0)
      );
    }
  }

  // --------------- Helper Actions ---------------
  /**
   * Toggles the paid plan modal
   * @param value
   */
  togglePaidPlanModal = (value?: boolean) => {
    this.isPaidPlanModalOpen = value ?? !this.isPaidPlanModalOpen;
  };

  handleSuccessModalToggle = (isOpen?: boolean) => {
    this.isSuccessPlanModalOpen = isOpen ?? !this.isSuccessPlanModalOpen;
  };

  /**
   * Toggles the update workspace seats modal
   * @param value
   * @returns
   */
  toggleAddWorkspaceSeatsModal = (value?: TAddWorkspaceSeatsModal) => {
    if (value) {
      this.addWorkspaceSeatsModal = {
        isOpen: value.isOpen,
      };
    } else {
      this.addWorkspaceSeatsModal = {
        isOpen: !this.addWorkspaceSeatsModal.isOpen,
      };
    }
  };

  /**
   * Toggles the remove unused seats confirmation modal
   * @returns
   */
  toggleRemoveUnusedSeatsConfirmationModal = () => {
    this.removeUnusedSeatsConfirmationModal = !this.removeUnusedSeatsConfirmationModal;
  };

  // --------------- Actions ---------------
  /**
   * Update the subscribed plan
   * @param workspaceSlug
   * @param payload
   */
  updateSubscribedPlan = (workspaceSlug: string, payload: Partial<IWorkspaceProductSubscription>) => {
    set(this.subscribedPlan, workspaceSlug, {
      ...this.subscribedPlan[workspaceSlug],
      ...payload,
    });
  };

  /**
   * Fetch the workspace subscribed plan
   * @param workspaceSlug
   * @returns
   */
  fetchWorkspaceSubscribedPlan = async (workspaceSlug: string) => {
    try {
      const response = await paymentService.getWorkspaceCurrentPlan(workspaceSlug);
      runInAction(() => {
        set(this.subscribedPlan, workspaceSlug, {
          product: response?.product ?? EProductSubscriptionEnum.FREE,
          is_cancelled: response?.is_cancelled ?? false,
          is_self_managed: response?.is_self_managed ?? true,
          interval: response?.interval ?? null,
          current_period_start_date: response?.current_period_start_date,
          current_period_end_date: response?.current_period_end_date,
          is_offline_payment: response?.is_offline_payment ?? false,
          trial_end_date: response?.trial_end_date ?? undefined,
          purchased_seats: response?.purchased_seats ?? 0,
          has_activated_free_trial: response?.has_activated_free_trial ?? false,
          has_added_payment_method: response?.has_added_payment_method ?? false,
          subscription: response?.subscription ?? undefined,
          is_on_trial: response?.is_on_trial ?? false,
          is_trial_allowed: response?.is_trial_allowed ?? false,
          remaining_trial_days: response?.remaining_trial_days ?? null,
          is_trial_ended: response?.is_trial_ended ?? false,
          has_upgraded: response?.has_upgraded ?? false,
          show_payment_button: response?.show_payment_button ?? true,
          show_trial_banner: response?.show_trial_banner ?? false,
          free_seats: response?.free_seats ?? 0,
          billable_members: response?.billable_members ?? 1,
          occupied_seats: response?.occupied_seats ?? 1,
          show_seats_banner: response?.show_seats_banner ?? false,
          is_free_member_count_exceeded: response?.is_free_member_count_exceeded ?? false,
          can_delete_workspace: response?.can_delete_workspace ?? true,
        });
      });
      return response;
    } catch (error) {
      runInAction(() => {
        set(this.subscribedPlan, workspaceSlug, {
          product: "FREE",
          is_cancelled: false,
          is_self_managed: true,
          interval: null,
          current_period_start_date: null,
          current_period_end_date: null,
          show_payment_button: true,
          free_seats: 0,
          billable_members: 1,
          occupied_seats: 1,
          show_seats_banner: false,
          is_free_member_count_exceeded: false,
          can_delete_workspace: true,
        });
      });
      throw error;
    }
  };

  /**
   * Refresh the workspace subscribed plan
   * @param workspaceSlug
   * @returns
   */
  refreshWorkspaceSubscribedPlan = async (workspaceSlug: string) => {
    try {
      await paymentService.refreshWorkspaceCurrentPlan(workspaceSlug);
    } catch (error) {
      throw error;
    }
  };

  /**
   * Free trial subscription
   * @param workspaceSlug
   * @param payload
   * @returns
   */
  freeTrialSubscription = async (workspaceSlug: string, payload: { product_id: string; price_id: string }) => {
    try {
      await paymentService.getFreeTrialSubscription(workspaceSlug, payload);
      // license check
      await this.refreshWorkspaceSubscribedPlan(workspaceSlug);
      // fetching workspace subscribed plan and feature flags
      await Promise.all([
        this.fetchWorkspaceSubscribedPlan(workspaceSlug),
        this.rootStore.featureFlags.fetchFeatureFlags(workspaceSlug),
      ]);
    } catch (error) {
      throw error;
    }
  };

  cancelFreeTrial = async (workspaceSlug: string) => {
    try {
      await paymentService.cancelFreeTrial(workspaceSlug);
      // fetching workspace subscribed plan and feature flags
      await Promise.all([
        this.fetchWorkspaceSubscribedPlan(workspaceSlug),
        this.rootStore.featureFlags.fetchFeatureFlags(workspaceSlug),
      ]);
    } catch (error) {
      throw error;
    }
  };
}
