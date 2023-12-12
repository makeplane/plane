import { useEffect } from "react";
// js cookie
import Cookie from "js-cookie";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";

const MobxStoreInit = () => {
  const { user: userStore } = useMobxStore();

  useEffect(() => {
    const authToken = Cookie.get("accessToken") || null;
    if (authToken) userStore.fetchCurrentUser();
  }, [userStore]);

  return <></>;
};

export default MobxStoreInit;
