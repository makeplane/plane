"use client";

import { observer } from "mobx-react-lite";
import useSWR from "swr";
// components
import { UserLoggedIn } from "@/components/account";
import { LogoSpinner } from "@/components/common";
import { AuthView } from "@/components/views";
// hooks
import { useUser } from "@/hooks/store";

function HomePage() {
  const { data: currentUser, fetchCurrentUser, isAuthenticated, isLoading } = useUser();

  useSWR("CURRENT_USER", () => fetchCurrentUser(), {
    errorRetryCount: 0,
    revalidateIfStale: false,
    revalidateOnFocus: false,
    refreshWhenHidden: false,
  });

  if (isLoading) return <LogoSpinner />;

  if (currentUser && isAuthenticated) return <UserLoggedIn />;

  return <AuthView />;
}

export default observer(HomePage);
