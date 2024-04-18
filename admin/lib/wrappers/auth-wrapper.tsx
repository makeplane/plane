"use client";

import { FC, ReactNode } from "react";
import { observer } from "mobx-react-lite";
import useSWR from "swr";
import { Spinner } from "@plane/ui";
// hooks
import { useInstance, useUser } from "@/hooks";
// helpers
import { EAuthenticationPageType, EUserStatus } from "@/helpers";
import { redirect } from "next/navigation";

export interface IAuthWrapper {
  children: ReactNode;
  authType?: EAuthenticationPageType;
}

export const AuthWrapper: FC<IAuthWrapper> = observer((props) => {
  const { children, authType = EAuthenticationPageType.AUTHENTICATED } = props;
  // hooks
  const { instance, fetchInstanceAdmins } = useInstance();
  const { isLoading, userStatus, currentUser, fetchCurrentUser } = useUser();

  useSWR("CURRENT_USER_DETAILS", () => fetchCurrentUser(), {
    shouldRetryOnError: false,
  });
  useSWR("INSTANCE_ADMINS", () => fetchInstanceAdmins(), {
    shouldRetryOnError: false,
  });

  if (isLoading)
    return (
      <div className="relative flex h-screen w-full items-center justify-center">
        <Spinner />
      </div>
    );

  if (userStatus && userStatus?.status === EUserStatus.ERROR)
    return (
      <div className="relative flex h-screen w-screen items-center justify-center">
        Something went wrong. please try again later
      </div>
    );

  if ([EAuthenticationPageType.AUTHENTICATED, EAuthenticationPageType.NOT_AUTHENTICATED].includes(authType)) {
    if (authType === EAuthenticationPageType.NOT_AUTHENTICATED) {
      if (currentUser === undefined) return <>{children}</>;
      else redirect("/general/");
    } else {
      if (currentUser) return <>{children}</>;
      else {
        if (instance?.instance?.is_setup_done) redirect("/login/");
        else redirect("/setup/");
      }
    }
  }

  return <>{children}</>;
});
