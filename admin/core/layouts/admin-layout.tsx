"use client";
import { FC, ReactNode, useEffect } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/navigation";
// components
import { InstanceSidebar } from "@/components/admin-sidebar";
import { InstanceHeader } from "@/components/auth-header";
import { LogoSpinner } from "@/components/common";
import { NewUserPopup } from "@/components/new-user-popup";
// hooks
import { useUser } from "@/hooks/store";

type TAdminLayout = {
  children: ReactNode;
};

export const AdminLayout: FC<TAdminLayout> = observer((props) => {
  const { children } = props;
  // router
  const router = useRouter();
  // store hooks
  const { isUserLoggedIn } = useUser();

  useEffect(() => {
    if (isUserLoggedIn === false) {
      router.push("/");
    }
  }, [router, isUserLoggedIn]);

  if (isUserLoggedIn === undefined) {
    return (
      <div className="relative flex h-screen w-full items-center justify-center">
        <LogoSpinner />
      </div>
    );
  }

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
});
