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
  labels;

  constructor() {
    this.user = new UserStore(this);
    this.theme = new ThemeStore(this);
    this.labels = new LabelStore(this);
  }
}
