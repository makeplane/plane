"use client";

import { FC, ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { observer } from "mobx-react-lite";
import useSWR from "swr";
import { Spinner } from "@plane/ui";
// layouts
import { DefaultLayout } from "@/layouts";
// components
import { InstanceNotReady } from "@/components/instance";
// hooks
import { useInstance } from "@/hooks";
// helpers
import { EInstanceStatus } from "@/helpers";

type TInstanceWrapper = {
  children: ReactNode;
};

export const InstanceWrapper: FC<TInstanceWrapper> = observer((props) => {
  const { children } = props;
  const searchparams = useSearchParams();
  const authEnabled = searchparams.get("auth_enabled") || "1";
  // hooks
  const { isLoading, instanceStatus, instance, fetchInstanceInfo } = useInstance();

  useSWR("INSTANCE_INFORMATION", () => fetchInstanceInfo(), {
    revalidateOnFocus: false,
  });

  if (isLoading)
    return (
      <div className="relative flex h-screen w-full items-center justify-center">
        <Spinner />
      </div>
    );

  if (instanceStatus && instanceStatus?.status === EInstanceStatus.ERROR)
    return (
      <div className="relative flex h-screen w-screen items-center justify-center">
        Something went wrong. please try again later
      </div>
    );

  if (instanceStatus && instanceStatus?.status === EInstanceStatus.NOT_YET_READY)
    return (
      <DefaultLayout>
        <InstanceNotReady isRedirectionEnabled={false} />
      </DefaultLayout>
    );

  if (instance?.instance?.is_setup_done === false && authEnabled === "1")
    return (
      <DefaultLayout>
        <InstanceNotReady />
      </DefaultLayout>
    );

  return <>{children}</>;
});
