// mobx lite
import { enableStaticRendering } from "mobx-react-lite";
// store imports
import UserStore from "./user";
import ThemeStore from "./theme";
import ProjectPublishStore, { IProjectPublishStore } from "./project-publish";

enableStaticRendering(typeof window === "undefined");

export class RootStore {
  user;
  theme;
  projectPublish: IProjectPublishStore;

  constructor() {
    this.user = new UserStore(this);
    this.theme = new ThemeStore(this);
    this.projectPublish = new ProjectPublishStore(this);
  }
}
