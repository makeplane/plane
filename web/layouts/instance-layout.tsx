import { FC, ReactNode } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { Spinner } from "@plane/ui";
// hooks
import { useStore } from "hooks";
// components
import { InstanceNotReady } from "components/instance";

type TInstanceLayout = {
  children: ReactNode;
};

const InstanceLayout: FC<TInstanceLayout> = observer((props) => {
  const { children } = props;
  // store
  const {
    instance: { isLoading, instance, error, fetchInstanceInfo },
  } = useStore();

  useSWR("INSTANCE_INFORMATION", () => fetchInstanceInfo(), {
    revalidateOnFocus: false,
  });

  if (isLoading)
    return (
      <div className="relative w-full h-screen flex justify-center items-center">
        <Spinner />
      </div>
    );

  if ((error && error?.status) || instance === undefined || !instance?.is_setup_done) return <InstanceNotReady />;

  return children;
});

export default InstanceLayout;
