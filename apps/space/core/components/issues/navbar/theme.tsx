import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useTheme } from "next-themes";

export const NavbarTheme = observer(function NavbarTheme() {
  // states
  const [appTheme, setAppTheme] = useState("light");
  // theme
  const { setTheme, theme } = useTheme();

  const handleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  useEffect(() => {
    if (!theme) return;
    setAppTheme(theme);
  }, [theme]);

  return (
    <button
      type="button"
      onClick={handleTheme}
      className="relative grid size-7 place-items-center rounded-sm bg-layer-transparent hover:bg-layer-transparent-hover text-primary"
    >
      <span className="material-symbols-rounded text-13">{appTheme === "light" ? "dark_mode" : "light_mode"}</span>
    </button>
  );
});
