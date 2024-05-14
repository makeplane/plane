"use client";

import { FC, ReactNode } from "react";
import { observer } from "mobx-react-lite";
import { redirect, useSearchParams } from "next/navigation";
import useSWR from "swr";
import { Spinner } from "@plane/ui";
// components
import { EmptyState } from "@/components/common";
import { InstanceNotReady } from "@/components/instance";
// helpers
import { EInstancePageType } from "@/helpers";
// hooks
import { useInstance } from "@/hooks/store";
// layouts
import { DefaultLayout } from "@/layouts/default-layout";

type TInstanceWrapper = {
  children: ReactNode;
  pageType?: EInstancePageType;
};

export const InstanceWrapper: FC<TInstanceWrapper> = observer((props) => {
  const { children, pageType } = props;
  const searchparams = useSearchParams();
  const authEnabled = searchparams.get("auth_enabled") || "1";
  // hooks
  const { isLoading, instance, fetchInstanceInfo } = useInstance();

  const { isLoading: isSWRLoading } = useSWR("INSTANCE_INFORMATION", () => fetchInstanceInfo(), {
    revalidateOnFocus: false,
    revalidateIfStale: false,
    revalidateOnReconnect: false,
    errorRetryCount: 0,
  });

  if (isSWRLoading || isLoading)
    return (
      <div className="relative flex h-screen w-full items-center justify-center">
        <Spinner />
      </div>
    );

  if (!instance) {
    return (
      <EmptyState
        title="Your instance wasn't configured successfully."
        description="Please try re-installing Plane to fix the problem. If the issue still persists please reach out to support@plane.so."
      />
    );
  }

  if (instance?.instance?.is_setup_done === false && authEnabled === "1")
    return (
      <DefaultLayout withoutBackground>
        <InstanceNotReady />
      </DefaultLayout>
    );

  if (instance?.instance?.is_setup_done && pageType === EInstancePageType.PRE_SETUP) redirect("/");

  if (!instance?.instance?.is_setup_done && pageType === EInstancePageType.POST_SETUP) redirect("/setup");

  return <>{children}</>;
});
