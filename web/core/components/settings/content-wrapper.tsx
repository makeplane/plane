import { ReactNode } from "react";

export const SettingsContentWrapper = ({ children }: { children: ReactNode }) => (
  <div className="relative flex flex-col w-full items-center mx-auto h-full overflow-y-scroll py-4 md:px-28 md:py-0">
    {children}
  </div>
);
