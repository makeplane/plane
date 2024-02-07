import { action, computed, makeObservable, observable, runInAction } from "mobx";
import set from "lodash/set";
// stores
import { UserViewStore } from "./view.store";
// types
import { TUserViewService } from "services/view/types";

type TUserViewRootStore = {
  // observables
  viewMap: Record<string, UserViewStore>;
  // computed
  viewIds: string[];
  // helper actions
  viewById: (viewId: string) => UserViewStore | undefined;
  // actions
  fetch: () => Promise<void>;
};

export class userViewRootStore implements TUserViewRootStore {
  // observables
  viewMap: Record<string, UserViewStore> = {};

  constructor(
    private service: TUserViewService,
    private workspaceSlug: string | undefined,
    private projectId: string | undefined,
    private featureId: string | undefined // moduleId/cycleId
  ) {
    makeObservable(this, {
      // observables
      viewMap: observable.ref,
      // computed
      viewIds: computed,
      // actions
      fetch: action,
    });
  }

  // computed
  get viewIds() {
    return Object.keys(this.viewMap);
  }

  // helper actions
  viewById = (viewId: string) => this.viewMap?.[viewId] || undefined;

  // actions
  fetch = async () => {
    if (!this.workspaceSlug) return;

    const view = await this.service.fetch(this.workspaceSlug, this.projectId, this.featureId);
    if (!view) return;

    // runInAction(() => {
    //   if (this.workspaceSlug && view.id)
    //     set(
    //       this.viewMap,
    //       [view.id],
    //       new UserViewStore(view, this.service, this.workspaceSlug, this.projectId, this.featureId)
    //     );
    // });
  };
}
