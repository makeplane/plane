"use client";

import { useEffect } from "react";
// next imports
import { useSearchParams } from "next/navigation";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";

const MobxStoreInit = () => {
  const store: RootStore = useMobxStore();

  // search params
  const routerSearchparams = useSearchParams();

  useEffect(() => {
    // theme
    const _theme = localStorage && localStorage.getItem("app_theme") ? localStorage.getItem("app_theme") : "light";
    if (_theme && store?.theme?.theme != _theme) store.theme.setTheme(_theme);
    else localStorage.setItem("app_theme", _theme && _theme != "light" ? "dark" : "light");
  }, [store?.theme]);

  useEffect(() => {
    if (!routerSearchparams) return;

    const states = routerSearchparams.get("states");
    const labels = routerSearchparams.get("labels");
    const priorities = routerSearchparams.get("priorities");

    store.issue.userSelectedLabels = labels?.split(",") || [];
    store.issue.userSelectedPriorities = priorities?.split(",") || [];
    store.issue.userSelectedStates = states?.split(",") || [];
  }, [routerSearchparams, store.issue]);

  return <></>;
};

export default MobxStoreInit;
