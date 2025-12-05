// next theme
import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useTheme } from "next-themes";

// mobx react lite

export const NavbarTheme = observer(function NavbarTheme() {
  const [appTheme, setAppTheme] = useState("light");

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
      className="relative grid h-7 w-7 place-items-center rounded-sm bg-surface-1 text-primary hover:bg-layer-1"
    >
      <span className="material-symbols-rounded-sm text-13">{appTheme === "light" ? "dark_mode" : "light_mode"}</span>
    </button>
  );
});
