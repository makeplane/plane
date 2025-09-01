"use client";

import { observer } from "mobx-react";
// components
import { UserLoggedIn } from "@/components/account/user-logged-in";
import { LogoSpinner } from "@/components/common/logo-spinner";
import { AuthView } from "@/components/views";
// hooks
import { useUser } from "@/hooks/store/use-user";

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
