// mobx lite
import { enableStaticRendering } from "mobx-react-lite";
// store imports
import UserStore from "./user";
import ThemeStore from "./theme";
import LabelStore from "./labels";

enableStaticRendering(typeof window === "undefined");

export class RootStore {
  user;
  theme;
  labelStore: LabelStore;

  constructor() {
    this.user = new UserStore(this);
    this.theme = new ThemeStore(this);
    this.labelStore = new LabelStore(this);
  }
}
