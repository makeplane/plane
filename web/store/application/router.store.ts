import { action, makeObservable, observable } from "mobx";

export interface IRouterStore {
  query: any;
  setQuery: (query: any) => void;
}

export class RouterStore implements IRouterStore {
  query = {};

  constructor() {
    makeObservable(this, {
      query: observable,
      setQuery: action,
    });
  }

  setQuery(query: any) {
    this.query = query;
  }
}
