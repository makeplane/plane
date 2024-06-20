import { action, makeObservable, observable, runInAction } from "mobx";
// types
import { IWorkspaceProductSubscription } from "@plane/types";
// services
import { PaymentService } from "@/plane-web/services/payment.service";

const paymentService = new PaymentService();

export interface IWorkspaceSubscriptionStore {
  subscribedPlan: "FREE" | "PRO" | "ULTIMATE";
  fetchWorkspaceSubscribedPlan: (workspaceSlug: string) => Promise<IWorkspaceProductSubscription>;
}

export class WorkspaceSubscriptionStore implements IWorkspaceSubscriptionStore {
  subscribedPlan: "FREE" | "PRO" | "ULTIMATE" = "FREE";

  constructor() {
    makeObservable(this, {
      subscribedPlan: observable.ref,
      fetchWorkspaceSubscribedPlan: action,
    });
  }

  fetchWorkspaceSubscribedPlan = async (workspaceSlug: string) => {
    try {
      const response = await paymentService.getWorkspaceCurrentPlane(workspaceSlug);
      runInAction(() => {
        this.subscribedPlan = response?.product || "FREE";
      });
      return response;
    } catch (error) {
      runInAction(() => {
        this.subscribedPlan = "FREE";
      });
      throw error;
    }
  };
}
