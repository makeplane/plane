import { FC, ReactNode } from "react";
import { observer } from "mobx-react-lite";
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
  const { isLoading, instance, fetchInstanceInfo } = useInstance();

  useSWR("INSTANCE_INFORMATION", () => fetchInstanceInfo(), {
    revalidateOnFocus: false,
  });

  if (isLoading)
    return (
      <div className="relative flex h-screen w-full items-center justify-center">
        <Spinner />
      </div>
    );

  if (instance?.instance?.is_setup_done === false) return <InstanceNotReady />;

  return <>{children}</>;
});

export default InstanceLayout;
