import { ReactNode } from "react";

export const SettingsContentWrapper = ({ children }: { children: ReactNode }) => (
  <div className="relative flex flex-col w-full items-center mx-auto h-full overflow-y-scroll px-28">{children}</div>
);
