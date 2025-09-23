"use client";

type TSidebarContentWrapperProps = {
  children: React.ReactNode;
};

export const SidebarContentWrapper = ({ children }: TSidebarContentWrapperProps) => (
  <div className="flex flex-col gap-3 overflow-x-hidden scrollbar-sm h-full w-full overflow-y-auto vertical-scrollbar px-3 pt-3">
    {children}
  </div>
);
