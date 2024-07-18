// plane web stores
import { IPagesListStore, PagesListStore } from "@/plane-web/store/pages";
// store
import { CoreRootStore } from "@/store/root.store";

export class RootStore extends CoreRootStore {
  pagesListStore: IPagesListStore;

  constructor() {
    super();
    this.pagesListStore = new PagesListStore(this);
  }

  reset() {
    super.reset();
    this.pagesListStore = new PagesListStore(this);
  }
}
