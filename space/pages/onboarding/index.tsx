import React, { useEffect } from "react";
// mobx
import { observer } from "mobx-react-lite";
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { OnBoardingForm } from "components/accounts/onboarding-form";

const imagePrefix = Boolean(parseInt(process.env.NEXT_PUBLIC_DEPLOY_WITH_NGINX || "0")) ? "/spaces" : "";

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
      <div className="flex h-full w-full flex-col gap-y-2 overflow-hidden sm:flex-row sm:gap-y-0">
        <div className="relative h-1/6 flex-shrink-0 sm:w-2/12 md:w-3/12 lg:w-1/5">
          <div className="absolute left-0 top-1/2 z-10 h-[0.5px] w-full -translate-y-1/2 border-b-[0.5px] border-custom-border-200 sm:left-1/2 sm:top-0 sm:h-screen sm:w-[0.5px] sm:-translate-x-1/2 sm:translate-y-0 sm:border-r-[0.5px] md:left-1/3" />
          <div className="absolute left-2 top-1/2 z-10 grid -translate-y-1/2 place-items-center bg-custom-background-100 px-3 py-5 sm:left-1/2 sm:top-12 sm:-translate-x-1/2 sm:translate-y-0 sm:px-0 md:left-1/3">
            <div className="h-[30px] w-[30px]">
              <img src={`${imagePrefix}/plane-logos/blue-without-text.png`} alt="Plane logo" />
            </div>
          </div>
          <div className="absolute right-4 top-1/4 -translate-y-1/2 text-sm font-medium text-custom-text-100 sm:fixed sm:right-16 sm:top-12 sm:translate-y-0 sm:py-5">
            {user?.email}
          </div>
        </div>
        <div className="relative flex h-full justify-center overflow-hidden px-8 pb-0 sm:w-10/12 sm:items-center sm:px-0 sm:py-12 sm:pr-[8.33%] md:w-9/12 lg:w-4/5">
          <OnBoardingForm user={user} />
        </div>
      </div>
    </div>
  );
};

export default observer(OnBoardingPage);
