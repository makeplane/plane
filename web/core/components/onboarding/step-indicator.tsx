import React from "react";
// helpers
import { cn } from "@/helpers/common.helper";

interface OnboardingStepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export const OnboardingStepIndicator: React.FC<OnboardingStepIndicatorProps> = ({ currentStep, totalSteps }) => {
  const renderIndicators = () => {
    const indicators = [];

    for (let i = 0; i < totalSteps; i++) {
      const isCompleted = i < currentStep;
      const isActive = i === currentStep - 1;
      const isFirstStep = i === 0;
      const isLastStep = i === totalSteps - 1;

      indicators.push(
        <div
          key={`line-${i}`}
          className={cn("h-1.5 -ml-0.5 w-full", {
            "bg-green-700": isCompleted,
            "bg-onboarding-background-100": !isCompleted,
            "rounded-l-full": isFirstStep,
            "rounded-r-full": isLastStep || isActive,
            "z-10": isActive,
          })}
        />
      );
    }

    return indicators;
  };

  return (
    <div className="flex flex-col justify-center">
      <div className="text-sm text-onboarding-text-300 font-medium">
        {currentStep} of {totalSteps} steps
      </div>
      <div className="flex items-center justify-center my-0.5 mx-1 w-40 lg:w-52">{renderIndicators()}</div>
    </div>
  );
};
