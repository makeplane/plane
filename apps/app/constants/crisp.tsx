import useUser from "hooks/use-user";
import { useCallback, useEffect } from "react";

declare global {
  interface Window {
    $crisp: any;
    CRISP_WEBSITE_ID: any;
  }
}

const Crisp = () => {
  const { user } = useUser();

  const validateCurrentUser = useCallback(() => {
    const currentUser = user ? user : null;

    if (currentUser && currentUser.email) return currentUser.email;

    return null;
  }, [user]);

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
};
export default Crisp;
