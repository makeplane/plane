// stores
import { makeObservable } from "mobx";
// plane web store
import {
  IIntegrationBaseStore,
  IntegrationBaseStore,
  IGithubAuthStore,
  GithubAuthStore,
  IGithubDataStore,
  GithubDataStore,
  IGithubEntityStore,
  GithubEntityStore,
} from "@/plane-web/store/integrations";
import { RootStore } from "@/plane-web/store/root.store";

export interface IGithubStore extends IIntegrationBaseStore {
  // store instances
  auth: IGithubAuthStore;
  data: IGithubDataStore;
  entity: IGithubEntityStore;
}

export class GithubStore extends IntegrationBaseStore implements IGithubStore {
  // store instances
  auth: IGithubAuthStore;
  data: IGithubDataStore;
  entity: IGithubEntityStore;

  constructor(protected store: RootStore) {
    super(store);
    makeObservable(this, {});

    // store instances
    this.auth = new GithubAuthStore(this);
    this.data = new GithubDataStore(this);
    this.entity = new GithubEntityStore(this);
  }
}
