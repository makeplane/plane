"use client";

import { FC, ReactNode } from "react";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { Spinner } from "@plane/ui";
// hooks
import { EAuthenticationPageType } from "@/helpers";
import { useInstance, useUser } from "@/hooks/store";
// helpers

export interface IAuthWrapper {
  children: ReactNode;
  authType?: EAuthenticationPageType;
}

export const AuthWrapper: FC<IAuthWrapper> = observer((props) => {
  const router = useRouter();
  // props
  const { children, authType = EAuthenticationPageType.AUTHENTICATED } = props;
  // hooks
  const { instance } = useInstance();
  const { isLoading, currentUser, fetchCurrentUser } = useUser();

  const { isLoading: isSWRLoading } = useSWR("CURRENT_USER_DETAILS", () => fetchCurrentUser(), {
    shouldRetryOnError: false,
  });

  if (isSWRLoading || isLoading)
    return (
      <div className="relative flex h-screen w-full items-center justify-center">
        <Spinner />
      </div>
    );

  if (authType === EAuthenticationPageType.NOT_AUTHENTICATED) {
    if (currentUser === undefined) return <>{children}</>;
    else {
      router.push("/general/");
      return <></>;
    }
  }

  if (authType === EAuthenticationPageType.AUTHENTICATED) {
    if (currentUser) return <>{children}</>;
    else {
      if (instance && instance?.instance?.is_setup_done) {
        router.push("/");
        return <></>;
      } else {
        router.push("/setup/");
        return <></>;
      }
    }
  }

  return <>{children}</>;
});
