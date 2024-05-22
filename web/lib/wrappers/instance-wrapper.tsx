import { FC, ReactNode } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
// components
import { LogoSpinner } from "@/components/common";
import { InstanceNotReady } from "@/components/instance";
// hooks
import { useInstance } from "@/hooks/store";

type TInstanceWrapper = {
  children: ReactNode;
};

export const InstanceWrapper: FC<TInstanceWrapper> = observer((props) => {
  const { children } = props;
  // store
  const { isLoading, instance, error, fetchInstanceInfo } = useInstance();

  const { isLoading: isInstanceSWRLoading } = useSWR("INSTANCE_INFORMATION", () => fetchInstanceInfo(), {
    revalidateOnFocus: false,
  });

  // loading state
  if ((isLoading || isInstanceSWRLoading) && !instance)
    return (
      <div className="relative flex h-screen w-full items-center justify-center">
        <LogoSpinner />
      </div>
    );

  // something went wrong while in the request
  if (error && error?.status === "error") return <>{children}</>;

  // instance is not ready and setup is not done
  if (instance?.is_setup_done === false) return <InstanceNotReady />;

  return <>{children}</>;
});
