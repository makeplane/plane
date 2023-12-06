import { FC, ReactNode, useEffect } from "react";

import useSWR from "swr";

// route
import { useRouter } from "next/router";
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
    instance: { fetchInstanceInfo, instance, createInstance },
  } = useMobxStore();

  const router = useRouter();
  const isGodMode = router.pathname.includes("god-mode");

  useSWR("INSTANCE_INFO", () => fetchInstanceInfo(), {
    revalidateOnFocus: false,
  });

  useEffect(() => {
    if (instance?.is_activated === false) {
      createInstance();
    }
  }, [instance?.is_activated, createInstance]);

  return (
    <div className="h-screen w-full overflow-hidden">
      {instance ? (
        !instance.is_setup_done && !isGodMode ? (
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
