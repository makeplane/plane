import { FC, ReactNode } from "react";
import { InstanceSidebar } from "@/components/auth-sidebar";
import { InstanceHeader } from "@/components/auth-header";

type TAdminLayout = {
  children: ReactNode;
};

export const AdminLayout: FC<TAdminLayout> = (props) => {
  const { children } = props;

  return (
    <div className="relative flex h-screen w-screen overflow-hidden">
      <InstanceSidebar />
      <main className="relative flex h-full w-full flex-col overflow-hidden bg-custom-background-100">
        <InstanceHeader />
        <div className="h-full w-full overflow-hidden">{children}</div>
      </main>
    </div>
  );
};
