// mobx lite
import { enableStaticRendering } from "mobx-react-lite";
// store imports
import UserStore from "./user";
import ThemeStore from "./theme";
import IssueStore from "./issues";

enableStaticRendering(typeof window === "undefined");

export class RootStore {
  user;
  theme;
  issues;

  constructor() {
    this.user = new UserStore(this);
    this.theme = new ThemeStore(this);
    this.issues = new IssueStore(this);
  }
}
