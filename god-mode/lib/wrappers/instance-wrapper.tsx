"use client";

import { FC, ReactNode } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { Spinner } from "@plane/ui";
// hooks
import { useInstance } from "@/hooks";
// components
import { InstanceNotReady } from "@/components/instance";

type TInstanceWrapper = {
  children: ReactNode;
};

export const InstanceWrapper: FC<TInstanceWrapper> = observer((props) => {
  const { children } = props;
  // store
  const { instance, fetchInstanceInfo } = useInstance();
  // derived values
  const isLoading = false;
  const error: any = {};

  useSWR("INSTANCE_INFORMATION", () => fetchInstanceInfo(), {
    revalidateOnFocus: false,
  });

  // loading state
  if (isLoading)
    return (
      <div className="relative flex h-screen w-full items-center justify-center">
        <Spinner />
      </div>
    );

  // something went wrong while in the request
  if (error && error?.status === "error")
    return (
      <div className="relative flex h-screen w-screen items-center justify-center">
        Something went wrong. please try again later
      </div>
    );

  // checking if the instance is activated or not
  if (error && !error?.data?.is_activated) return <InstanceNotReady />;

  // instance is not ready and setup is not done
  if (instance?.instance?.is_setup_done === false)
    // if (isGodModeEnabled) return <MiniGodModeForm />;
    return <InstanceNotReady />;

  return <>{children}</>;
});
