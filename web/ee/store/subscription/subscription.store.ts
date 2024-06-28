import { set } from "lodash";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
// types
import { IWorkspaceProductSubscription, TProductSubscriptionType } from "@plane/types";
// services
import { PaymentService } from "@/plane-web/services/payment.service";
// plane web store
import { RootStore } from "@/plane-web/store/root.store";

const paymentService = new PaymentService();

type TWorkspaceSubscriptionMap = {
  [workspaceSlug: string]: TProductSubscriptionType;
};

export interface IWorkspaceSubscriptionStore {
  subscribedPlan: TWorkspaceSubscriptionMap;
  currentWorkspaceSubscribedPlan: TProductSubscriptionType | undefined;
  fetchWorkspaceSubscribedPlan: (workspaceSlug: string) => Promise<IWorkspaceProductSubscription>;
}

export class WorkspaceSubscriptionStore implements IWorkspaceSubscriptionStore {
  subscribedPlan: TWorkspaceSubscriptionMap = {};

  constructor(private rootStore: RootStore) {
    makeObservable(this, {
      subscribedPlan: observable,
      currentWorkspaceSubscribedPlan: computed,
      fetchWorkspaceSubscribedPlan: action,
    });
  }

  get currentWorkspaceSubscribedPlan() {
    if (!this.rootStore.router.workspaceSlug) return undefined;
    return this.subscribedPlan[this.rootStore.router.workspaceSlug] || undefined;
  }

  fetchWorkspaceSubscribedPlan = async (workspaceSlug: string) => {
    try {
      const response = await paymentService.getWorkspaceCurrentPlane(workspaceSlug);
      runInAction(() => {
        set(this.subscribedPlan, workspaceSlug, response?.product || "FREE");
      });
      return response;
    } catch (error) {
      runInAction(() => {
        set(this.subscribedPlan, workspaceSlug, "FREE");
      });
      throw error;
    }
  };
}
