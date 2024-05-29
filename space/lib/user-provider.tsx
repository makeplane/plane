import { ReactNode } from "react";
import { observer } from "mobx-react-lite";
import useSWR from "swr";
import { useUser } from "@/hooks/store";

export const UserProvider = observer(({ children }: { children: ReactNode }) => {
  const { fetchCurrentUser } = useUser();

  useSWR("CURRENT_USER", () => fetchCurrentUser());

  return <>{children}</>;
});
