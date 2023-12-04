import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { observer } from "mobx-react-lite";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useRouter } from "next/router";
import { Lightbulb } from "lucide-react";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { SignInRoot } from "components/account";
// ui
import { Loader, Spinner } from "@plane/ui";
// images
import BluePlaneLogoWithoutText from "public/plane-logos/blue-without-text.png";
import latestFeatures from "public/onboarding/onboarding-pages.svg";
// types
import { IUser, IUserSettings } from "types";

export type AuthType = "sign-in" | "sign-up";

export const SignInView = observer(() => {
  // store
  const {
    user: { fetchCurrentUser, fetchCurrentUserSettings },
    appConfig: { envConfig },
  } = useMobxStore();
  // router
  const router = useRouter();
  const { next: next_url } = router.query;
  // states
  const [isLoading, setLoading] = useState(false);
  // next-themes
  const { resolvedTheme } = useTheme();

  const handleSignInRedirection = useCallback(
    async (user: IUser) => {
      // if the user is not onboarded, redirect them to the onboarding page
      if (!user.is_onboarded) {
        router.push("/onboarding");
        return;
      }
      // if next_url is provided, redirect the user to that url
      if (next_url) {
        router.push(next_url.toString());
        return;
      }

      // if the user is onboarded, fetch their last workspace details
      await fetchCurrentUserSettings()
        .then((userSettings: IUserSettings) => {
          const workspaceSlug =
            userSettings?.workspace?.last_workspace_slug || userSettings?.workspace?.fallback_workspace_slug;
          if (workspaceSlug) router.push(`/${workspaceSlug}`);
          else router.push("/profile");
        })
        .catch(() => setLoading(false));
    },
    [fetchCurrentUserSettings, router, next_url]
  );

  const mutateUserInfo = useCallback(async () => {
    await fetchCurrentUser().then(async (user) => {
      await handleSignInRedirection(user);
    });
  }, [fetchCurrentUser, handleSignInRedirection]);

  useEffect(() => {
    mutateUserInfo();
  }, [mutateUserInfo]);

  return (
    <>
      {isLoading ? (
        <div className="grid place-items-center h-screen">
          <Spinner />
        </div>
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
              {!envConfig ? (
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
                      <Link href="https://plane.so/changelog" target="_blank" rel="noopener noreferrer">
                        <span className="font-medium text-sm underline hover:cursor-pointer">Learn more</span>
                      </Link>
                    </p>
                  </div>
                  <div className="border border-onboarding-border-200 sm:w-96 sm:h-52 object-cover mt-8 mx-auto rounded-md bg-onboarding-background-100 overflow-hidden">
                    <div className="h-[90%]">
                      <Image
                        src={latestFeatures}
                        alt="Plane Issues"
                        className={`rounded-md h-full ml-8 -mt-2 ${
                          resolvedTheme === "dark" ? "bg-onboarding-background-100" : "bg-custom-primary-70"
                        } `}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
});
