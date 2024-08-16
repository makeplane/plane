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
  currentWorkspaceSubscribedPlanDetail: IWorkspaceProductSubscription | undefined;
  toggleProPlanModal: (value?: boolean) => void;
  fetchWorkspaceSubscribedPlan: (workspaceSlug: string) => Promise<IWorkspaceProductSubscription>;
  refreshWorkspaceSubscribedPlan: (workspaceSlug: string) => Promise<void>;
  freeTrialSubscription: (workspaceSlug: string, payload: { product_id: string; price_id: string }) => Promise<void>;
}

export class WorkspaceSubscriptionStore implements IWorkspaceSubscriptionStore {
  subscribedPlan: TWorkspaceSubscriptionMap = {};
  isProPlanModalOpen = false;

  constructor(private rootStore: RootStore) {
    makeObservable(this, {
      subscribedPlan: observable,
      isProPlanModalOpen: observable.ref,
      currentWorkspaceSubscribedPlanDetail: computed,
      toggleProPlanModal: action,
      fetchWorkspaceSubscribedPlan: action,
      refreshWorkspaceSubscribedPlan: action,
    });
  }

  get currentWorkspaceSubscribedPlanDetail() {
    if (!this.rootStore.router.workspaceSlug) return undefined;
    return this.subscribedPlan[this.rootStore.router.workspaceSlug] || undefined;
  }

  toggleProPlanModal = (value?: boolean) => {
    this.isProPlanModalOpen = value ?? !this.isProPlanModalOpen;
  };

  fetchWorkspaceSubscribedPlan = async (workspaceSlug: string) => {
    try {
      const response = await paymentService.getWorkspaceCurrentPlan(workspaceSlug);
      runInAction(() => {
        set(this.subscribedPlan, workspaceSlug, {
          product: response?.product || "FREE",
          is_canceled: response?.is_canceled || false,
          interval: response?.interval || null,
          current_period_end_date: response?.current_period_end_date,
        });
      });
      return response;
    } catch (error) {
      runInAction(() => {
        set(this.subscribedPlan, workspaceSlug, {
          product: "FREE",
          is_canceled: false,
          interval: null,
          current_period_end_date: null,
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
