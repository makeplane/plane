import { useEffect, useCallback } from "react";
import { observer } from "mobx-react-lite";
import Image from "next/image";
// components
import { InstanceSetupFormRoot } from "components/instance";
// hooks
import { useMobxStore } from "lib/mobx/store-provider";
// images
import BluePlaneLogoWithoutText from "public/plane-logos/blue-without-text.png";

export const InstanceSetupView = observer(() => {
  // store
  const {
    user: { fetchCurrentUser },
  } = useMobxStore();

  const mutateUserInfo = useCallback(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  useEffect(() => {
    mutateUserInfo();
  }, [mutateUserInfo]);

  return (
    <>
      <div className="bg-onboarding-gradient-100 h-full w-full flex flex-col">
        <div className="flex items-center justify-between sm:py-5 px-8 pb-4 sm:px-16 lg:px-28 ">
          <div className="flex gap-x-2 py-10 items-center">
            <Image src={BluePlaneLogoWithoutText} height={30} width={30} alt="Plane Logo" className="mr-2" />
            <span className="font-semibold text-2xl sm:text-3xl">Plane</span>
          </div>
        </div>
        <InstanceSetupFormRoot />
      </div>
    </>
  );
});
