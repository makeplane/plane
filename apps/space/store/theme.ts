// mobx
import { observable, action, computed, makeObservable, runInAction } from "mobx";
// types
import { IThemeStore } from "./types";

class ThemeStore implements IThemeStore {
  theme: "light" | "dark" = "light";
  // root store
  rootStore;

  constructor(_rootStore: any | null = null) {
    makeObservable(this, {
      // observable
      theme: observable,
      // action
      setTheme: action,
      // computed
    });

    this.rootStore = _rootStore;
  }

  setTheme = async (_theme: "light" | "dark" | string) => {
    try {
      localStorage.setItem("app_theme", _theme);
      this.theme = _theme === "light" ? "light" : "dark";
    } catch (error) {
      console.error("setting user theme error", error);
    }
  };
}

export default ThemeStore;
