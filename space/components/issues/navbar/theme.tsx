"use client";

// mobx react lite
import { observer } from "mobx-react-lite";
// mobx
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";

export const NavbarTheme = observer(() => {
  const store: RootStore = useMobxStore();

  const handleTheme = () => {
    store?.theme?.setTheme(store?.theme?.theme === "light" ? "dark" : "light");
  };

  return (
    <div
      className="relative w-[28px] h-[28px] flex justify-center items-center rounded-sm cursor-pointer bg-gray-100 hover:bg-gray-200 hover:bg-gray-200/60 text-gray-600 transition-all"
      onClick={handleTheme}
    >
      {store?.theme?.theme === "light" ? (
        <span className={`material-symbols-rounded text-[18px]`}>dark_mode</span>
      ) : (
        <span className={`material-symbols-rounded text-[18px]`}>light_mode</span>
      )}
    </div>
  );
});
