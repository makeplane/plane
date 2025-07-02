"use client";

import { FC, ReactNode, useEffect } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
// components
import { LogoSpinner } from "@/components/common/logo-spinner";
import { NewUserPopup } from "@/components/new-user-popup";
// hooks
import { useUser } from "@/hooks/store";
// plane admin hooks
import { useInstanceFeatureFlags } from "@/plane-admin/hooks/store/use-instance-feature-flag";
// local components
import { AdminHeader } from "./header";
import { AdminSidebar } from "./sidebar";

type TAdminLayout = {
  children: ReactNode;
};

const AdminLayout: FC<TAdminLayout> = (props) => {
  const { children } = props;
  // router
  const router = useRouter();
  // store hooks
  const { isUserLoggedIn } = useUser();
  // plane admin hooks
  const { fetchInstanceFeatureFlags } = useInstanceFeatureFlags();
  // fetching instance feature flags
  const { isLoading: flagsLoader, error: flagsError } = useSWR(
    `INSTANCE_FEATURE_FLAGS`,
    () => fetchInstanceFeatureFlags(),
    { revalidateOnFocus: false, revalidateIfStale: false, errorRetryCount: 1 }
  );

  useEffect(() => {
    if (isUserLoggedIn === false) {
      router.push("/");
    }
  }, [router, isUserLoggedIn]);

  if ((flagsLoader && !flagsError) || isUserLoggedIn === undefined) {
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
        <main className="relative flex h-full w-full flex-col overflow-hidden bg-custom-background-100">
          <AdminHeader />
          <div className="h-full w-full overflow-hidden">{children}</div>
        </main>
        <NewUserPopup />
      </div>
    );
  }

  return <></>;
};

export default observer(AdminLayout);
