import { FC, ReactNode } from "react";
import { observer } from "mobx-react-lite";
import useSWR from "swr";
// ui
import { Spinner } from "@plane/ui";
// components
import { InstanceNotReady } from "@/components/instance";
// hooks
import { useInstance } from "@/hooks/store";

type TInstanceWrapper = {
  children: ReactNode;
};

export const InstanceWrapper: FC<TInstanceWrapper> = observer((props) => {
  const { children } = props;
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

  if (instance?.instance?.is_setup_done === false) return <InstanceNotReady />;

  return <>{children}</>;
});
