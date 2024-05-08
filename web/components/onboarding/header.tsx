import { FC } from "react";
import Image from "next/image";
// images
import BluePlaneLogoWithoutText from "public/plane-logos/blue-without-text.png";
// components
import { OnboardingStepIndicator } from "./step-indicator";

export type OnboardingHeaderProps = {
  currentStep: number;
  totalSteps: number;
};

export const OnboardingHeader: FC<OnboardingHeaderProps> = (props) => {
  const { currentStep, totalSteps } = props;

  return (
    <div className="flex w-full items-center justify-between font-semibold ">
      <div className="flex items-center gap-x-2">
        <Image src={BluePlaneLogoWithoutText} height={30} width={30} alt="Plane Logo" className="mr-3" />
        <OnboardingStepIndicator currentStep={currentStep} totalSteps={totalSteps} />
      </div>
    </div>
  );
};
