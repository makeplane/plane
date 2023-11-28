import { FC, ReactNode } from "react";

import useSWR from "swr";

// store
import { observer } from "mobx-react-lite";
import { useMobxStore } from "lib/mobx/store-provider";

// components
import { Spinner } from "@plane/ui";
import { InstanceNotReady } from "components/instance";

type Props = {
  children: ReactNode;
};

const InstanceLayout: FC<Props> = observer(({ children }) => {
  // store
  const {
    instance: { fetchInstanceInfo, instance },
  } = useMobxStore();

  console.log("instance", instance);

  useSWR("INSTANCE_INFO", () => fetchInstanceInfo());

  return (
    <div className="h-screen w-full overflow-hidden">
      {instance ? (
        !instance.is_setup_done ? (
          <InstanceNotReady />
        ) : (
          children
        )
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <Spinner />
        </div>
      )}
    </div>
  );
});

export default InstanceLayout;
