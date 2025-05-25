import { FC, ReactNode } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
// components
import { InstanceFailureView } from "@/components/instance/failure";
import { InstanceLoading } from "@/components/instance/loading";
import { InstanceSetupForm } from "@/components/instance/setup-form";
// hooks
import { useInstance } from "@/hooks/store";

type InstanceProviderProps = {
  children: ReactNode;
};

export const InstanceProvider: FC<InstanceProviderProps> = observer((props) => {
  const { children } = props;

  // store hooks
  const { instance, error, fetchInstanceInfo } = useInstance();
  // fetching instance details
  useSWR("INSTANCE_DETAILS", () => fetchInstanceInfo(), {
    revalidateOnFocus: false,
    revalidateIfStale: false,
    errorRetryCount: 0,
  });

  if (!instance && !error) {
    return (
      <div className="relative h-full w-full overflow-y-auto px-6 py-10 mx-auto flex justify-center items-center">
        <InstanceLoading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative h-full w-full overflow-y-auto px-6 py-10 mx-auto flex justify-center items-center">
        <InstanceFailureView />
      </div>
    );
  }

  if (instance && !instance?.is_setup_done) {
    return (
      <div className="relative h-full w-full overflow-y-auto px-6 py-10 mx-auto flex justify-center items-center">
        <InstanceSetupForm />
      </div>
    );
  }

  return <>{children}</>;
});
