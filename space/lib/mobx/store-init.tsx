"use client";

import { useEffect } from "react";
// next imports
import { useRouter } from "next/router";
// js cookie
import Cookie from "js-cookie";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";

const MobxStoreInit = () => {
  const { user: userStore }: RootStore = useMobxStore();

  const router = useRouter();
  const { states, labels, priorities } = router.query as { states: string[]; labels: string[]; priorities: string[] };

  // useEffect(() => {
  //   store.issue.userSelectedLabels = labels || [];
  //   store.issue.userSelectedPriorities = priorities || [];
  //   store.issue.userSelectedStates = states || [];
  // }, [store.issue]);

  useEffect(() => {
    const authToken = Cookie.get("accessToken") || null;
    if (authToken) userStore.fetchCurrentUser();
  }, [userStore]);

  return <></>;
};

export default MobxStoreInit;
