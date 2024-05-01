import { useEffect } from "react";
import { observer } from "mobx-react-lite";
import Image from "next/image";
// ui
import { useTheme } from "next-themes";
import useSWR from "swr";
import { Spinner } from "@plane/ui";
// components
import { AuthRoot, UserLoggedIn } from "@/components/accounts";
// mobx
import useAuthRedirection from "@/hooks/use-auth-redirection";
import { useMobxStore } from "@/lib/mobx/store-provider";
// images
import PlaneBackgroundPatternDark from "public/auth/background-pattern-dark.svg";
import PlaneBackgroundPattern from "public/auth/background-pattern.svg";
import BluePlaneLogoWithoutText from "public/plane-logos/blue-without-text-new.png";

export const AuthView = observer(() => {
  // hooks
  const { resolvedTheme } = useTheme();
  // store
  const {
    user: { currentUser, fetchCurrentUser, loader },
  } = useMobxStore();
  // sign in redirection hook
  const { isRedirecting, handleRedirection } = useAuthRedirection();

  // fetching user information
  useSWR("CURRENT_USER_DETAILS", () => fetchCurrentUser(), {
    shouldRetryOnError: false,
    revalidateOnFocus: false,
  });

  useEffect(() => {
    handleRedirection();
  }, [handleRedirection]);

  return (
    <>
      {loader || isRedirecting ? (
        <div className="relative flex h-screen w-screen items-center justify-center">
          <Spinner />
        </div>
      ) : (
        <>
          {currentUser ? (
            <UserLoggedIn />
          ) : (
            <div className="relative w-full h-screen overflow-hidden">
              <div className="absolute inset-0 z-0">
                <Image
                  src={resolvedTheme === "dark" ? PlaneBackgroundPatternDark : PlaneBackgroundPattern}
                  className="w-screen min-h-screen object-cover"
                  alt="Plane background pattern"
                />
              </div>
              <div className="relative z-10">
                <div className="flex items-center justify-between px-8 pb-4 sm:px-16 sm:py-5 lg:px-28">
                  <div className="flex items-center gap-x-2 py-10">
                    <Image src={BluePlaneLogoWithoutText} height={30} width={30} alt="Plane Logo" className="mr-2" />
                    <span className="text-2xl font-semibold sm:text-3xl">Plane</span>
                  </div>
                </div>
                <div className="mx-auto h-full">
                  <div className="h-full overflow-auto px-7 pt-4 sm:px-0">
                    <AuthRoot />
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
});
