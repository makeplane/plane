"use client";

import { observer } from "mobx-react";
// components
import { UserLoggedIn } from "@/components/account";
import { LogoSpinner } from "@/components/common";
import { AuthView } from "@/components/views";
// hooks
import { useUser } from "@/hooks/store";

const HomePage = observer(() => {
  const { data: currentUser, isAuthenticated, isInitializing } = useUser();

  if (isInitializing)
    return (
      <div className="flex h-screen min-h-[500px] w-full justify-center items-center">
        <LogoSpinner />
      </div>
    );

  if (currentUser && isAuthenticated) return <UserLoggedIn />;

  return <AuthView />;
});

export default HomePage;
