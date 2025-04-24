import { ReactNode } from "react";

export const SettingsContentWrapper = ({ children }: { children: ReactNode }) => (
  <div className="relative flex flex-col min-w-[60%] items-center mx-auto overflow-y-scroll px-12">{children}</div>
);
