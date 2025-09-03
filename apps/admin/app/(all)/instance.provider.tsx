import { observer } from "mobx-react";
import useSWR from "swr";
// hooks
import { useInstance } from "@/hooks/store";

type InstanceProviderProps = {
  children: React.ReactNode;
};

export const InstanceProvider: React.FC<InstanceProviderProps> = observer((props) => {
  const { children } = props;
  // store hooks
  const { fetchInstanceInfo } = useInstance();
  // fetching instance details
  useSWR("INSTANCE_DETAILS", () => fetchInstanceInfo(), {
    revalidateOnFocus: false,
    revalidateIfStale: false,
    errorRetryCount: 0,
  });

  return <>{children}</>;
});
