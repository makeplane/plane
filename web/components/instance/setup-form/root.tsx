import { useState } from "react";
// components
import { LatestFeatureBlock } from "components/common";
import { InstanceSetupDone, InstanceSetupSignInForm } from "components/instance";

export enum EInstanceSetupSteps {
  SIGN_IN = "SIGN_IN",
  DONE = "DONE",
}

export const InstanceSetupFormRoot = () => {
  // states
  const [setupStep, setSetupStep] = useState(EInstanceSetupSteps.SIGN_IN);

  return (
    <>
      {setupStep === EInstanceSetupSteps.DONE && <InstanceSetupDone />}
      {setupStep === EInstanceSetupSteps.SIGN_IN && (
        <div className="mx-auto h-full rounded-t-md border-x border-t border-custom-border-200 bg-onboarding-gradient-100 px-4 pt-4 shadow-sm sm:w-4/5 md:w-2/3">
          <div className="h-full overflow-auto rounded-t-md bg-onboarding-gradient-200 pb-56 pt-24">
            <div className="mx-auto flex flex-col">
              <InstanceSetupSignInForm handleNextStep={() => setSetupStep(EInstanceSetupSteps.DONE)} />
            </div>
            <LatestFeatureBlock />
          </div>
        </div>
      )}
    </>
  );
};
