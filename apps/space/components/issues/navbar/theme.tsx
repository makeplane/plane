"use client";

// react
import { useEffect } from "react";

// next theme
import { useTheme } from "next-themes";

// mobx react lite
import { observer } from "mobx-react-lite";
// mobx
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";

export const NavbarTheme = observer(() => {
  const store: RootStore = useMobxStore();

  const { setTheme, theme } = useTheme();

  const handleTheme = () => {
    store?.theme?.setTheme(store?.theme?.theme === "light" ? "dark" : "light");
    setTheme(theme === "light" ? "dark" : "light");
    document?.documentElement.setAttribute("data-theme", theme ?? store?.theme?.theme);
  };

  useEffect(() => {
    document?.documentElement.setAttribute("data-theme", theme ?? store?.theme?.theme);
  }, [theme, store]);

  return (
    <div
      className="relative w-[28px] h-[28px] flex justify-center rounded-md items-center rounded-sm cursor-pointer bg-custom-background-100 hover:bg-custom-background-200 hover:bg-custom-background-200/60 text-custom-text-100 transition-all"
      onClick={handleTheme}
    >
      {theme === "light" ? (
        <span className={`material-symbols-rounded text-[18px]`}>dark_mode</span>
      ) : (
        <span className={`material-symbols-rounded text-[18px]`}>light_mode</span>
      )}
    </div>
  );
});
