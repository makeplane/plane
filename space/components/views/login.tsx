import { useCallback } from "react";
import { useRouter } from "next/router";

import Link from "next/link";
import Image from "next/image";

// mobx
import { observer } from "mobx-react-lite";
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { SignInRoot, UserLoggedIn } from "components/accounts";
import { Loader } from "@plane/ui";
// types
import { IUser } from "types/user";
import { Lightbulb } from "lucide-react";
// images
import BluePlaneLogoWithoutText from "public/plane-logos/blue-without-text.png";
import signInIssues from "public/onboarding/onboarding-issues.svg";

export const LoginView = observer(() => {
  // store
  const {
    user: { currentUser, fetchCurrentUser, loader },
  } = useMobxStore();
  // router
  const router = useRouter();
  const { next_path } = router.query as { next_path: string };

  const handleSignInRedirection = useCallback(
    async (user: IUser) => {
      const isOnboard = user?.is_onboarded || false;

      if (isOnboard) {
        if (next_path) router.push(next_path);
        else router.push("/login");
      } else {
        if (next_path) router.push(`/onboarding?next_path=${next_path}`);
        else router.push("/onboarding");
      }
    },
    [router, next_path]
  );

  const mutateUserInfo = useCallback(async () => {
    await fetchCurrentUser().then(async (user) => {
      await handleSignInRedirection(user);
    });
  }, [fetchCurrentUser, handleSignInRedirection]);

  return (
    <>
      {loader ? (
        <div className="relative flex h-screen w-screen items-center justify-center">Loading</div> // TODO: Add spinner instead
      ) : (
        <>
          {currentUser ? (
            <UserLoggedIn />
          ) : (
            <div className={`bg-onboarding-gradient-100 h-full w-full`}>
              <div className="flex items-center justify-between sm:py-5 px-8 pb-4 sm:px-16 lg:px-28 ">
                <div className="flex gap-x-2 py-10 items-center">
                  <Image src={BluePlaneLogoWithoutText} height={30} width={30} alt="Plane Logo" className="mr-2" />
                  <span className="font-semibold text-2xl sm:text-3xl">Plane</span>
                </div>
              </div>

              <div className="h-full bg-onboarding-gradient-100 md:w-2/3 sm:w-4/5 px-4 pt-4 rounded-t-md mx-auto shadow-sm border-x border-t border-custom-border-200 ">
                <div className="px-7 sm:px-0 bg-onboarding-gradient-200 h-full pt-24 pb-56 rounded-t-md overflow-auto">
                  {!true ? (
                    <div className="pt-10 mx-auto flex justify-center">
                      <div>
                        <Loader className="space-y-4 w-full pb-4 mx-auto">
                          <Loader.Item height="46px" width="360px" />
                          <Loader.Item height="46px" width="360px" />
                        </Loader>

                        <Loader className="space-y-4 w-full pt-4 mx-auto">
                          <Loader.Item height="46px" width="360px" />
                          <Loader.Item height="46px" width="360px" />
                        </Loader>
                      </div>
                    </div>
                  ) : (
                    <>
                      <SignInRoot handleSignInRedirection={mutateUserInfo} />

                      <div className="flex py-2 bg-onboarding-background-100 border border-onboarding-border-200 mx-auto rounded-[3.5px] sm:w-96 mt-16">
                        <Lightbulb className="h-7 w-7 mr-2 mx-3" />
                        <p className="text-sm text-left text-onboarding-text-100">
                          Pages gets a facelift! Write anything and use Galileo to help you start.{" "}
                          <Link
                            href="https://plane.so/changelog"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-sm underline hover:cursor-pointer"
                          >
                            Learn more
                          </Link>
                        </p>
                      </div>
                      <div className="flex justify-center border border-onboarding-border-200 sm:w-96 sm:h-52 object-cover mt-8 mx-auto rounded-md bg-onboarding-background-100 ">
                        <Image
                          src={signInIssues}
                          alt="Plane Issues"
                          className={`flex object-cover rounded-md bg-custom-primary-70 `}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
});
