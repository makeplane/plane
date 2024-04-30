import { useEffect, ReactNode, FC } from "react";
// hooks
import { IUser } from "@plane/types";

declare global {
  interface Window {
    $crisp: unknown[];
    CRISP_WEBSITE_ID: unknown;
  }
}

export interface ICrispWrapper {
  children: ReactNode;
  user: IUser | undefined;
}

const CrispWrapper: FC<ICrispWrapper> = (props) => {
  const { children, user } = props;

  useEffect(() => {
    if (typeof window && user?.email && process.env.NEXT_PUBLIC_CRISP_ID) {
      window.$crisp = [];
      window.CRISP_WEBSITE_ID = process.env.NEXT_PUBLIC_CRISP_ID;
      (function () {
        const d = document;
        const s = d.createElement("script");
        s.src = "https://client.crisp.chat/l.js";
        s.async = true;
        d.getElementsByTagName("head")[0].appendChild(s);
        window.$crisp.push(["set", "user:email", [user.email]]);
        window.$crisp.push(["do", "chat:hide"]);
        window.$crisp.push(["do", "chat:close"]);
      })();
    }
  }, [user?.email]);

  return <>{children}</>;
};

export default CrispWrapper;
