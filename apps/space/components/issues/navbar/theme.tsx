"use client";

// next theme
import { useTheme } from "next-themes";

// mobx react lite
import { observer } from "mobx-react-lite";

export const NavbarTheme = observer(() => {
  const { setTheme, theme } = useTheme();

  const handleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <button
      type="button"
      onClick={handleTheme}
      className="relative w-7 h-7 grid place-items-center bg-custom-background-100 hover:bg-custom-background-80 text-custom-text-100 rounded"
    >
      <span className="material-symbols-rounded text-sm">{theme === "light" ? "dark_mode" : "light_mode"}</span>
    </button>
  );
});
