import { useCallback, useEffect } from "react";
import { observer } from "mobx-react-lite";
// hooks
import { useMobxStore } from "lib/mobx/store-provider";

declare global {
  interface Window {
    $crisp: any;
    CRISP_WEBSITE_ID: any;
  }
}

const Crisp = observer(() => {
  const { user: userStore } = useMobxStore();
  const { currentUser } = userStore;

  const validateCurrentUser = useCallback(() => {
    if (currentUser) return currentUser.email;
    return null;
  }, [currentUser]);

  useEffect(() => {
    if (typeof window && validateCurrentUser()) {
      window.$crisp = [];
      window.CRISP_WEBSITE_ID = process.env.NEXT_PUBLIC_CRISP_ID;
      (function () {
        var d = document;
        var s = d.createElement("script");
        s.src = "https://client.crisp.chat/l.js";
        s.async = true;
        d.getElementsByTagName("head")[0].appendChild(s);
        // defining email when logged in
        if (validateCurrentUser()) {
          window.$crisp.push(["set", "user:email", [validateCurrentUser()]]);
          window.$crisp.push(["do", "chat:hide"]);
          window.$crisp.push(["do", "chat:close"]);
        }
      })();
    }
  }, [validateCurrentUser]);

  return <></>;
});
export default Crisp;
