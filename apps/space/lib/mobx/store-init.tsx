"use client";

import { useEffect } from "react";
// next imports
import { useSearchParams } from "next/navigation";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";

const MobxStoreInit = () => {
  const store: any = useMobxStore();

  // search params
  const routerSearchparams = useSearchParams();

  const board = routerSearchparams.get("board") as string;

  useEffect(() => {
    // theme
    const _theme = localStorage && localStorage.getItem("app_theme") ? localStorage.getItem("app_theme") : "light";
    if (store?.theme?.theme != _theme) store.theme.setTheme(_theme);
    else localStorage.setItem("app_theme", _theme && _theme != "light" ? "dark" : "light");
  }, [store?.theme]);

  // updating default board view when we are in the issues page
  useEffect(() => {
    if (board && board != store?.issue?.currentIssueBoardView) store.issue.setCurrentIssueBoardView(board);
  }, [board, store?.issue]);

  return <></>;
};

export default MobxStoreInit;
