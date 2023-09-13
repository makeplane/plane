import React, { useEffect } from "react";
// mobx
import { observer } from "mobx-react-lite";
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { OnBoardingForm } from "components/accounts/onboarding-form";

const imagePrefix = process.env.NEXT_PUBLIC_DEPLOY_WITH_NGINX ? "/spaces" : "";

const OnBoardingPage = () => {
  const { user: userStore } = useMobxStore();

  const user = userStore?.currentUser;

  useEffect(() => {
    const user = userStore?.currentUser;

    if (!user) {
      userStore.fetchCurrentUser();
    }
  }, [userStore]);

  return (
    <div className="h-screen w-full overflow-hidden bg-custom-background-100">
      <div className="flex h-full w-full flex-col gap-y-2 sm:gap-y-0 sm:flex-row overflow-hidden">
        <div className="relative h-1/6 flex-shrink-0 sm:w-2/12 md:w-3/12 lg:w-1/5">
          <div className="absolute border-b-[0.5px] sm:border-r-[0.5px] border-custom-border-200 h-[0.5px] w-full top-1/2 left-0 -translate-y-1/2 sm:h-screen sm:w-[0.5px] sm:top-0 sm:left-1/2 md:left-1/3 sm:-translate-x-1/2 sm:translate-y-0 z-10" />
          <div className="absolute grid place-items-center bg-custom-background-100 px-3 sm:px-0 py-5 left-2 sm:left-1/2 md:left-1/3 sm:-translate-x-1/2 top-1/2 -translate-y-1/2 sm:translate-y-0 sm:top-12 z-10">
            <div className="h-[30px] w-[30px]">
              <img src={`${imagePrefix}/plane-logos/blue-without-text.png`} alt="Plane logo" />
            </div>
          </div>
          <div className="absolute sm:fixed text-custom-text-100 text-sm font-medium right-4 top-1/4 sm:top-12 -translate-y-1/2 sm:translate-y-0 sm:right-16 sm:py-5">
            {user?.email}
          </div>
        </div>
        <div className="relative flex justify-center sm:items-center h-full px-8 pb-0 sm:px-0 sm:py-12 sm:pr-[8.33%] sm:w-10/12 md:w-9/12 lg:w-4/5 overflow-hidden">
          <OnBoardingForm user={user} />
        </div>
      </div>
    </div>
  );
};

export default observer(OnBoardingPage);
