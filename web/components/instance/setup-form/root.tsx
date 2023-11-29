import { useState } from "react";
// components
import { InstanceSetupEmailCodeForm } from "./email-code-form";
import { InstanceSetupEmailForm } from "./email-form";
import { InstanceSetupPasswordForm } from "./password-form";
import { LatestFeatureBlock } from "components/common";
import { InstanceSetupDone } from "components/instance";

export enum EInstanceSetupSteps {
  EMAIL = "EMAIL",
  VERIFY_CODE = "VERIFY_CODE",
  PASSWORD = "PASSWORD",
  DONE = "DONE",
}

export const InstanceSetupFormRoot = () => {
  // states
  const [setupStep, setSetupStep] = useState(EInstanceSetupSteps.EMAIL);
  const [email, setEmail] = useState<string>("");

  return (
    <>
      {setupStep === EInstanceSetupSteps.DONE ? (
        <div>
          <InstanceSetupDone />
        </div>
      ) : (
        <div className="h-full bg-onboarding-gradient-100 md:w-2/3 sm:w-4/5 px-4 pt-4 rounded-t-md mx-auto shadow-sm border-x border-t border-custom-border-200 ">
          <div className={`px-7 sm:px-0 bg-onboarding-gradient-200 h-full pt-24 pb-56 rounded-t-md overflow-auto`}>
            <div className="sm:w-96 mx-auto flex flex-col divide-y divide-custom-border-200">
              {setupStep === EInstanceSetupSteps.EMAIL && (
                <InstanceSetupEmailForm
                  handleNextStep={(email) => {
                    setEmail(email);
                    setSetupStep(EInstanceSetupSteps.VERIFY_CODE);
                  }}
                />
              )}

              {setupStep === EInstanceSetupSteps.VERIFY_CODE && (
                <InstanceSetupEmailCodeForm
                  email={email}
                  handleNextStep={() => {
                    setSetupStep(EInstanceSetupSteps.PASSWORD);
                  }}
                  moveBack={() => {
                    setSetupStep(EInstanceSetupSteps.EMAIL);
                  }}
                />
              )}

              {setupStep === EInstanceSetupSteps.PASSWORD && (
                <InstanceSetupPasswordForm
                  email={email}
                  onNextStep={() => {
                    setSetupStep(EInstanceSetupSteps.DONE);
                  }}
                  resetSteps={() => {
                    setSetupStep(EInstanceSetupSteps.EMAIL);
                  }}
                />
              )}
            </div>
            <LatestFeatureBlock />
          </div>
        </div>
      )}
    </>
  );
};
