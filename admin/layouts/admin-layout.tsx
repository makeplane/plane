import { FC, ReactNode } from "react";
// components
import { InstanceSidebar } from "@/components/admin-sidebar";
import { InstanceHeader } from "@/components/auth-header";
import { NewUserPopup } from "@/components/new-user-popup";

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
      <NewUserPopup />
    </div>
  );
};
