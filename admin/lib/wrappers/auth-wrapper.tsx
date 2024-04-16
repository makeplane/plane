"use client";

import { FC, ReactNode } from "react";
import { usePathname, redirect } from "next/navigation";
import { observer } from "mobx-react";
import useSWR from "swr";
import { Spinner } from "@plane/ui";
// layouts
import { AuthLayout } from "@/layouts";
// hooks
import { useUser } from "@/hooks";
// helpers
import { EUserStatus } from "@/helpers";

export interface IAuthWrapper {
  children: ReactNode;
}

export const AuthWrapper: FC<IAuthWrapper> = observer((props) => {
  const pathname = usePathname();

  const { children } = props;
  // hooks
  const { isLoading, userStatus, currentUser, fetchCurrentUser } = useUser();

  useSWR("CURRENT_USER_DETAILS", () => fetchCurrentUser(), {
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

  if ((userStatus && userStatus?.status === EUserStatus.AUTHENTICATION_NOT_DONE) || currentUser === undefined) {
    if (!["/", "/setup", "/login"].includes(pathname)) redirect("/general");
  } else {
    if (["/", "/setup", "/login"].includes(pathname)) redirect("/general");
  }

  return <AuthLayout>{children}</AuthLayout>;
});
