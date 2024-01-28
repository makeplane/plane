import { useEffect, useCallback } from "react";
import { observer } from "mobx-react-lite";
import Image from "next/image";
// components
import { InstanceSetupFormRoot } from "components/instance";
// hooks
import { useUser } from "hooks/store";
// images
import BluePlaneLogoWithoutText from "public/plane-logos/blue-without-text.png";

export const InstanceSetupView = observer(() => {
  // store hooks
  const { fetchCurrentUser } = useUser();

  const mutateUserInfo = useCallback(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  useEffect(() => {
    mutateUserInfo();
  }, [mutateUserInfo]);

  return (
    <>
      <div className="flex h-full w-full flex-col bg-onboarding-gradient-100">
        <div className="flex items-center justify-between px-8 pb-4 sm:px-16 sm:py-5 lg:px-28 ">
          <div className="flex items-center gap-x-2 py-10">
            <Image src={BluePlaneLogoWithoutText} height={30} width={30} alt="Plane Logo" className="mr-2" />
            <span className="text-2xl font-semibold sm:text-3xl">Plane</span>
          </div>
        </div>
        <InstanceSetupFormRoot />
      </div>
    </>
  );
});
