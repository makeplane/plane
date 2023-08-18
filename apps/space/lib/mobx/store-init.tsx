"use client";

import { useEffect } from "react";
// next imports
import { useSearchParams } from "next/navigation";
// interface
import { TIssueBoardKeys } from "store/types";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";

const MobxStoreInit = () => {
  const store: RootStore = useMobxStore();

  // search params
  const routerSearchparams = useSearchParams();

  const board = routerSearchparams.get("board") as TIssueBoardKeys;

  useEffect(() => {
    // theme
    const _theme = localStorage && localStorage.getItem("app_theme") ? localStorage.getItem("app_theme") : "light";
    if (_theme && store?.theme?.theme != _theme) store.theme.setTheme(_theme);
    else localStorage.setItem("app_theme", _theme && _theme != "light" ? "dark" : "light");
  }, [store?.theme]);

  return <></>;
};

export default MobxStoreInit;
