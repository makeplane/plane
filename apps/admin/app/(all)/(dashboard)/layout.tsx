import { useEffect } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/navigation";
import { Outlet } from "react-router";
// components
import { AdminHeader } from "@/components/common/header";
import { LogoSpinner } from "@/components/common/logo-spinner";
import { NewUserPopup } from "@/components/new-user-popup";
// hooks
import { useUser } from "@/hooks/store";
// local components
import type { Route } from "./+types/layout";
import { AdminSidebar } from "./sidebar";

function AdminLayout(_props: Route.ComponentProps) {
  // router
  const { replace } = useRouter();
  // store hooks
  const { isUserLoggedIn } = useUser();

  useEffect(() => {
    if (isUserLoggedIn === false) replace("/");
  }, [replace, isUserLoggedIn]);

  if (isUserLoggedIn === undefined) {
    return (
      <div className="relative flex h-screen w-full items-center justify-center">
        <LogoSpinner />
      </div>
    );
  }

  if (isUserLoggedIn) {
    return (
      <div className="relative flex h-screen w-screen overflow-hidden">
        <AdminSidebar />
        <main className="relative flex h-full w-full flex-col overflow-hidden bg-surface-1">
          <AdminHeader />
          <div className="h-full w-full overflow-hidden overflow-y-scroll vertical-scrollbar scrollbar-md">
            <Outlet />
          </div>
        </main>
        <NewUserPopup />
      </div>
    );
  }

  return <></>;
}

export default observer(AdminLayout);
