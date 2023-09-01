// next theme
import { useTheme } from "next-themes";

// mobx react lite
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";

export const NavbarTheme = observer(() => {
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
      className="relative w-7 h-7 grid place-items-center bg-custom-background-100 hover:bg-custom-background-80 text-custom-text-100 rounded"
    >
      <span className="material-symbols-rounded text-sm">{appTheme === "light" ? "dark_mode" : "light_mode"}</span>
    </button>
  );
});
