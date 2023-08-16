// mobx lite
import { enableStaticRendering } from "mobx-react-lite";
// store imports
import UserStore from "./user";
import ThemeStore from "./theme";
import LabelStore from "./label";
import ProjectPublishStore, { IProjectPublishStore } from "./project-publish";

enableStaticRendering(typeof window === "undefined");

export class RootStore {
  user;
  theme;
  label: LabelStore;
  projectPublish: IProjectPublishStore;

  constructor() {
    this.user = new UserStore(this);
    this.theme = new ThemeStore(this);
    this.label = new LabelStore(this);
    this.projectPublish = new ProjectPublishStore(this);
  }
}
