// stores
import { makeObservable } from "mobx";
// plane web store
import {
  IIntegrationBaseStore,
  IntegrationBaseStore,
  IGitlabAuthStore,
  GitlabAuthStore,
  IGitlabDataStore,
  GitlabDataStore,
  IGitlabEntityConnectionStore,
  GitlabEntityStore,
} from "@/plane-web/store/integrations";
import { RootStore } from "@/plane-web/store/root.store";

export interface IGitlabEnterpriseStore extends IIntegrationBaseStore {
  // store instances
  auth: IGitlabAuthStore;
  data: IGitlabDataStore;
  entityConnection: IGitlabEntityConnectionStore;
}

export class GitlabEnterpriseStore extends IntegrationBaseStore implements IGitlabEnterpriseStore {
  // store instances
  auth: IGitlabAuthStore;
  data: IGitlabDataStore;
  entityConnection: IGitlabEntityConnectionStore;

  constructor(protected store: RootStore) {
    super(store);
    makeObservable(this, {});

    // store instances
    this.auth = new GitlabAuthStore(this, true);
    this.data = new GitlabDataStore(this, true);
    this.entityConnection = new GitlabEntityStore(this, true);
  }
}
