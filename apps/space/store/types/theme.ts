export interface IThemeStore {
  theme: string;
  setTheme: (theme: "light" | "dark") => void;
}
