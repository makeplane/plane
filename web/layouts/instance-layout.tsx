import { FC, ReactNode, useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
// ui
import { Spinner } from "@plane/ui";
// components
import { InstanceNotReady } from "@/components/instance";
// hooks
import { useInstance } from "@/hooks/store";

type TInstanceLayout = {
  children: ReactNode;
};

const InstanceLayout: FC<TInstanceLayout> = observer((props) => {
  const { children } = props;
  // store
  const { isLoading, instance, error, fetchInstanceInfo } = useInstance();
  // states
  const [isGodModeEnabled, setIsGodModeEnabled] = useState(false);
  const handleGodModeStateChange = (state: boolean) => setIsGodModeEnabled(state);

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
  if (error && !error?.data?.is_activated) return <InstanceNotReady isGodModeEnabled={false} />;

  // instance is not ready and setup is not done
  if (instance?.instance?.is_setup_done === false)
    // if (isGodModeEnabled) return <MiniGodModeForm />;
    return <InstanceNotReady isGodModeEnabled handleGodModeStateChange={handleGodModeStateChange} />;

  return <>{children}</>;
});

export default InstanceLayout;
