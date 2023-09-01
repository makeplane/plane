"use client";

import { useEffect } from "react";
// next imports
import { useRouter } from "next/router";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";

const MobxStoreInit = () => {
  const store: RootStore = useMobxStore();

  const router = useRouter();
  const { states, labels, priorities } = router.query as { states: string[]; labels: string[]; priorities: string[] };

  useEffect(() => {
    // theme
    const _theme = localStorage && localStorage.getItem("app_theme") ? localStorage.getItem("app_theme") : "light";
    if (_theme && store?.theme?.theme != _theme) store.theme.setTheme(_theme);
    else localStorage.setItem("app_theme", _theme && _theme != "light" ? "dark" : "light");
  }, [store?.theme]);

  // useEffect(() => {
  //   store.issue.userSelectedLabels = labels || [];
  //   store.issue.userSelectedPriorities = priorities || [];
  //   store.issue.userSelectedStates = states || [];
  // }, [store.issue]);

  return <></>;
};

export default MobxStoreInit;
