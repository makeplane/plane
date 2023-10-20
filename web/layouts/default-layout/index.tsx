import { FC, ReactNode } from "react";

type Props = {
  children: ReactNode;
  gradient?: boolean;
};

const DefaultLayout: FC<Props> = ({ children, gradient = false }) => (
  <div className={`h-screen w-full overflow-hidden ${gradient ? "" : "bg-custom-background-100"}`}>{children}</div>
);

export default DefaultLayout;
