import { action, makeObservable, observable, runInAction } from "mobx";
// types
import { IWorkspaceProductSubscription } from "@plane/types";
// services
import { DiscoService } from "@/services/disco.service";

const discoService = new DiscoService();

export interface IWorkspaceSubscriptionStore {
  subscribedPlan: "FREE" | "PRO";
  fetchWorkspaceSubscribedPlan: (workspaceSlug: string) => Promise<IWorkspaceProductSubscription>;
}

export class WorkspaceSubscriptionStore implements IWorkspaceSubscriptionStore {
  subscribedPlan: "FREE" | "PRO" = "FREE";

  constructor() {
    makeObservable(this, {
      subscribedPlan: observable.ref,
      fetchWorkspaceSubscribedPlan: action,
    });
  }

  fetchWorkspaceSubscribedPlan = async (workspaceSlug: string) => {
    try {
      const response = await discoService.getWorkspaceCurrentPlane(workspaceSlug);
      runInAction(() => {
        this.subscribedPlan = response.product;
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
