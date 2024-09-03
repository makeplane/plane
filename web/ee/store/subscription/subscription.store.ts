/* eslint-disable no-useless-catch */
import { set } from "lodash";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
// types
import { IWorkspaceProductSubscription } from "@plane/types";
// services
import { PaymentService } from "@/plane-web/services/payment.service";
// plane web store
import { RootStore } from "@/plane-web/store/root.store";

const paymentService = new PaymentService();

type TWorkspaceSubscriptionMap = {
  [workspaceSlug: string]: IWorkspaceProductSubscription;
};

export interface IWorkspaceSubscriptionStore {
  subscribedPlan: TWorkspaceSubscriptionMap;
  isProPlanModalOpen: boolean;
  isSuccessPlanModalOpen: boolean;
  currentWorkspaceSubscribedPlanDetail: IWorkspaceProductSubscription | undefined;
  toggleProPlanModal: (value?: boolean) => void;
  handleSuccessModalToggle: (isOpen?: boolean) => void;
  fetchWorkspaceSubscribedPlan: (workspaceSlug: string) => Promise<IWorkspaceProductSubscription>;
  refreshWorkspaceSubscribedPlan: (workspaceSlug: string) => Promise<void>;
  freeTrialSubscription: (workspaceSlug: string, payload: { product_id: string; price_id: string }) => Promise<void>;
}

export class WorkspaceSubscriptionStore implements IWorkspaceSubscriptionStore {
  subscribedPlan: TWorkspaceSubscriptionMap = {};
  isProPlanModalOpen = false;
  isSuccessPlanModalOpen: boolean = false;

  constructor(private rootStore: RootStore) {
    makeObservable(this, {
      subscribedPlan: observable,
      isProPlanModalOpen: observable.ref,
      isSuccessPlanModalOpen: observable,
      currentWorkspaceSubscribedPlanDetail: computed,
      toggleProPlanModal: action,
      fetchWorkspaceSubscribedPlan: action,
      refreshWorkspaceSubscribedPlan: action,
      freeTrialSubscription: action,
    });
  }

  get currentWorkspaceSubscribedPlanDetail() {
    if (!this.rootStore.router.workspaceSlug) return undefined;
    return this.subscribedPlan[this.rootStore.router.workspaceSlug] || undefined;
  }

  toggleProPlanModal = (value?: boolean) => {
    this.isProPlanModalOpen = value ?? !this.isProPlanModalOpen;
  };

  handleSuccessModalToggle = (isOpen?: boolean) => {
    this.isSuccessPlanModalOpen = isOpen ?? !this.isSuccessPlanModalOpen;
  };

  fetchWorkspaceSubscribedPlan = async (workspaceSlug: string) => {
    try {
      const response = await paymentService.getWorkspaceCurrentPlan(workspaceSlug);
      runInAction(() => {
        set(this.subscribedPlan, workspaceSlug, {
          product: response?.product ?? "FREE",
          is_cancelled: response?.is_cancelled ?? false,
          is_self_managed: response?.is_self_managed ?? false,
          interval: response?.interval ?? null,
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
          has_upgraded: response?.has_upgraded ?? false,
          show_payment_button: response?.show_payment_button ?? true,
          show_trial_banner: response?.show_trial_banner ?? false,
        });
      });
      return response;
    } catch (error) {
      runInAction(() => {
        set(this.subscribedPlan, workspaceSlug, {
          product: "FREE",
          is_cancelled: false,
          is_self_managed: false,
          interval: null,
          current_period_end_date: null,
          show_payment_button: true,
        });
      });
      throw error;
    }
  };

  refreshWorkspaceSubscribedPlan = async (workspaceSlug: string) => {
    try {
      await paymentService.refreshWorkspaceCurrentPlan(workspaceSlug);
    } catch (error) {
      throw error;
    }
  };

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
}
