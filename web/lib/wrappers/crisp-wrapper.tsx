import { useCallback, useEffect, ReactNode, FC } from "react";
// hooks
import { IUser } from "types";

declare global {
  interface Window {
    $crisp: any;
    CRISP_WEBSITE_ID: any;
  }
}

export interface ICrispWrapper {
  children: ReactNode;
  user: IUser;
}

const CrispWrapper: FC<ICrispWrapper> = (props) => {
  const { children, user } = props;

  const validateCurrentUser = useCallback(() => {
    if (user) return user.email;
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

  return <>{children}</>;
};

export default CrispWrapper;
