import { FC, ReactNode, useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { Spinner } from "@plane/ui";
// hooks
import { useStore } from "hooks";
// components
import { InstanceNotReady, MiniGodModeForm } from "components/instance";

type TInstanceLayout = {
  children: ReactNode;
};

const InstanceLayout: FC<TInstanceLayout> = observer((props) => {
  const { children } = props;
  // store
  const {
    instance: { isLoading, instance, error, fetchInstanceInfo },
  } = useStore();
  // states
  const [isGodModeEnabled, setIsGodModeEnabled] = useState(false);
  const handleGodModeStateChange = (state: boolean) => setIsGodModeEnabled(state);

  useSWR("INSTANCE_INFORMATION", () => fetchInstanceInfo(), {
    revalidateOnFocus: false,
  });

  // loading state
  if (isLoading)
    return (
      <div className="relative w-full h-screen flex justify-center items-center">
        <Spinner />
      </div>
    );

  // something went wrong while in the request
  if (error && error?.status === "error")
    return (
      <div className="w-screen h-screen relative flex justify-center items-center">
        Something went wrong. please try again later
      </div>
    );

  // checking if the instance is activated or not
  if (error && !error?.data?.is_activated) return <InstanceNotReady isGodModeEnabled={false} />;

  // instance is not ready and setup is not done
  if (instance?.instance?.is_setup_done === false)
    if (isGodModeEnabled) return <MiniGodModeForm />;
    else return <InstanceNotReady isGodModeEnabled handleGodModeStateChange={handleGodModeStateChange} />;

  return <>{children}</>;
});

export default InstanceLayout;
