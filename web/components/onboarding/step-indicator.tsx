import React from "react";

export const OnboardingStepIndicator = ({ step }: { step: number }) => (
  <div className="flex items-center justify-center">
    <div className="z-10 h-3 w-3 rounded-full bg-custom-primary-100" />
    <div className={`-ml-1 h-1 w-14 ${step >= 2 ? "bg-custom-primary-100" : "bg-onboarding-background-100"}`} />
    <div
      className={` z-10 -ml-1 rounded-full ${
        step >= 2 ? "h-3 w-3 bg-custom-primary-100" : " h-2 w-2 bg-onboarding-background-100"
      }`}
    />
    <div className={`-ml-1 h-1 w-14 ${step >= 3 ? "bg-custom-primary-100" : "bg-onboarding-background-100"}`} />
    <div
      className={`z-10 -ml-1 rounded-full ${
        step >= 3 ? "h-3 w-3 bg-custom-primary-100" : "h-2 w-2 bg-onboarding-background-100"
      }`}
    />
  </div>
);
