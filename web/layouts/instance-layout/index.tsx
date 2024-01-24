import { FC, ReactNode } from "react";
import { useRouter } from "next/router";
import useSWR from "swr";
import { observer } from "mobx-react-lite";
// hooks
import { useApplication } from "hooks/store";
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
  } = useApplication();

  const router = useRouter();
  const isGodMode = router.pathname.includes("god-mode");

  useSWR("INSTANCE_INFO", () => fetchInstanceInfo(), {
    revalidateOnFocus: false,
  });

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
