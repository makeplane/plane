import React from "react";

const OnboardingStepIndicator = ({ step }: { step: number }) => (
  <div className="flex items-center justify-center">
    <div className="h-3 w-3 rounded-full bg-custom-primary-100 z-10" />
    <div className={`h-1 w-14 -ml-1 ${step >= 2 ? "bg-custom-primary-100" : "bg-onboarding-background-100"}`} />
    <div
      className={` z-10 -ml-1 rounded-full ${
        step >= 2 ? "bg-custom-primary-100 h-3 w-3" : " h-2 w-2 bg-onboarding-background-100"
      }`}
    />
    <div className={`h-1 w-14 -ml-1 ${step >= 3 ? "bg-custom-primary-100" : "bg-onboarding-background-100"}`} />
    <div
      className={`rounded-full -ml-1 z-10 ${
        step >= 3 ? "bg-custom-primary-100 h-3 w-3" : "h-2 w-2 bg-onboarding-background-100"
      }`}
    />
  </div>
);

export default OnboardingStepIndicator;
