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
        <div className="h-full bg-onboarding-gradient-100 md:w-2/3 sm:w-4/5 px-4 pt-4 rounded-t-md mx-auto shadow-sm border-x border-t border-custom-border-200">
          <div className="bg-onboarding-gradient-200 h-full pt-24 pb-56 rounded-t-md overflow-auto">
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
