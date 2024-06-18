import { useEffect, ReactNode, FC } from "react";
import { observer } from "mobx-react";
// hooks
import { useUser } from "@/hooks/store";

declare global {
  interface Window {
    $crisp: unknown[];
    CRISP_WEBSITE_ID: unknown;
  }
}

export interface ICrispWrapper {
  children: ReactNode;
}

const CrispWrapper: FC<ICrispWrapper> = observer((props) => {
  const { children } = props;
  const { data: user } = useUser();

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
});

export default CrispWrapper;
