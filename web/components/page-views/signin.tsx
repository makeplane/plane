import { useEffect } from "react";
import { observer } from "mobx-react-lite";
import Image from "next/image";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// hooks
import useSignInRedirection from "hooks/use-sign-in-redirection";
// components
import { SignInRoot } from "components/account";
// ui
import { Loader, Spinner } from "@plane/ui";
// images
import BluePlaneLogoWithoutText from "public/plane-logos/blue-without-text.png";

export type AuthType = "sign-in" | "sign-up";

export const SignInView = observer(() => {
  // store
  const {
    user: { currentUser },
    appConfig: { envConfig },
  } = useMobxStore();
  // sign in redirection hook
  const { isRedirecting, handleRedirection } = useSignInRedirection();

  useEffect(() => {
    handleRedirection();
  }, [handleRedirection]);

  if (isRedirecting || currentUser)
    return (
      <div className="grid place-items-center h-screen">
        <Spinner />
      </div>
    );

  return (
    <div className="bg-onboarding-gradient-100 h-full w-full">
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
            <SignInRoot />
          )}
        </div>
      </div>
    </div>
  );
});
