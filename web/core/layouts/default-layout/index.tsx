import { FC, ReactNode } from "react";

type Props = {
  children: ReactNode;
  gradient?: boolean;
};

const DefaultLayout: FC<Props> = ({ children, gradient = false }) => {
  if (window.navigator.userAgent.indexOf("iPhone") > -1) {
    const viewportMeta = document.querySelector("[name=viewport]");
    if (viewportMeta) {
      viewportMeta.setAttribute("content", "width=device-width, initial-scale=1, maximum-scale=1");
    }
  }
  return (
    <div className={`h-screen w-full overflow-hidden ${gradient ? "" : "bg-custom-background-100"}`}>{children}</div>
  );
};

export default DefaultLayout;
