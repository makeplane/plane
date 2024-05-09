"use client";

import { FC, ReactNode } from "react";
import { redirect, useSearchParams } from "next/navigation";
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
import { EInstancePageType } from "@/helpers";

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
  });

  if (isSWRLoading || isLoading)
    return (
      <div className="relative flex h-screen w-full items-center justify-center">
        <Spinner />
      </div>
    );

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
