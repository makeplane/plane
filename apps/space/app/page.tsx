"use client";
import { useEffect } from "react";
import { observer } from "mobx-react";
import { useSearchParams, useRouter } from "next/navigation";
// plane imports
import { isValidNextPath } from "@plane/utils";
// components
import { UserLoggedIn } from "@/components/account/user-logged-in";
import { LogoSpinner } from "@/components/common/logo-spinner";
import { AuthView } from "@/components/views";
// hooks
import { useUser } from "@/hooks/store/use-user";

const HomePage = observer(() => {
  const { data: currentUser, isAuthenticated, isInitializing } = useUser();
  const searchParams = useSearchParams();
  const router = useRouter();
  const nextPath = searchParams.get("next_path");

  useEffect(() => {
    if (currentUser && isAuthenticated && nextPath && isValidNextPath(nextPath)) {
      router.replace(nextPath);
    }
  }, [currentUser, isAuthenticated, nextPath, router]);

  if (isInitializing)
    return (
      <div className="flex h-screen min-h-[500px] w-full justify-center items-center">
        <LogoSpinner />
      </div>
    );

  if (currentUser && isAuthenticated) {
    if (nextPath && isValidNextPath(nextPath)) {
      return (
        <div className="flex h-screen min-h-[500px] w-full justify-center items-center">
          <LogoSpinner />
        </div>
      );
    }
    return <UserLoggedIn />;
  }

  return <AuthView />;
});

export default HomePage;
