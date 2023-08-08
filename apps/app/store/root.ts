// mobx lite
import { enableStaticRendering } from "mobx-react-lite";
// store imports
import UserStore from "./user";
import ThemeStore from "./theme";

enableStaticRendering(typeof window === "undefined");

export class RootStore {
  user;
  theme;

  constructor() {
    this.user = new UserStore(this);
    this.theme = new ThemeStore(this);
  }
}
