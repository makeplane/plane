"use client";

import { useEffect } from "react";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";

const MobxStoreInit = () => {
  const store: RootStore = useMobxStore();

  useEffect(() => {
    // theme
    const _theme = localStorage && localStorage.getItem("app_theme") ? localStorage.getItem("app_theme") : "light";
    if (_theme && store?.theme?.theme != _theme) store.theme.setTheme(_theme);
    else localStorage.setItem("app_theme", _theme && _theme != "light" ? "dark" : "light");
  }, [store?.theme]);

  return <></>;
};

export default MobxStoreInit;
