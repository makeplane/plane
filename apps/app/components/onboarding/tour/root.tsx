import { useState } from "react";

import Image from "next/image";

// hooks
import useUser from "hooks/use-user";
// components
import { TourSidebar } from "components/onboarding";
// ui
import { PrimaryButton, SecondaryButton } from "components/ui";
// icons
import { XMarkIcon } from "@heroicons/react/24/outline";
// images
import PlaneWhiteLogo from "public/plane-logos/white-horizontal.svg";
import IssuesTour from "public/onboarding/issues.svg";
import CyclesTour from "public/onboarding/cycles.svg";
import ModulesTour from "public/onboarding/modules.svg";

type Props = {
  onComplete: () => void;
};

export type TTourSteps = "welcome" | "issues" | "cycles" | "modules" | "views" | "pages";

const TOUR_STEPS: {
  key: TTourSteps;
  title: string;
  description: string;
  image: any;
  prevStep?: TTourSteps;
  nextStep?: TTourSteps;
}[] = [
  {
    key: "issues",
    title: "Plan with Issues",
    description:
      "The issue is the building block of the Plane. Most concepts in Plane are either associated with issues and their properties.",
    image: IssuesTour,
    nextStep: "cycles",
  },
  {
    key: "cycles",
    title: "Move with Cycles",
    description:
      "Cycles help you and your team to progress faster, similar to the sprints commonly used in agile development.",
    image: CyclesTour,
    prevStep: "issues",
    nextStep: "modules",
  },
  {
    key: "modules",
    title: "Break into Modules",
    description:
      "Modules break your big think into Projects or Features,  to help you organize better.",
    image: ModulesTour,
    prevStep: "cycles",
    nextStep: "views",
  },
  {
    key: "views",
    title: "Views",
    description:
      "Modules break your big think into Projects or Features,  to help you organize better.",
    image: ModulesTour,
    prevStep: "modules",
    nextStep: "pages",
  },
  {
    key: "pages",
    title: "Pages",
    description:
      "Modules break your big think into Projects or Features,  to help you organize better.",
    image: ModulesTour,
    prevStep: "views",
  },
];

export const TourRoot: React.FC<Props> = ({ onComplete }) => {
  const [step, setStep] = useState<TTourSteps>("welcome");

  const { user } = useUser();

  const currentStep = TOUR_STEPS.find((tourStep) => tourStep.key === step);

  return (
    <div className="relative h-full w-full grid place-items-center">
      {step === "welcome" ? (
        <div className="w-2/5 h-3/4 bg-brand-base rounded-[10px] overflow-hidden">
          <div className="h-full overflow-hidden">
            <div className="h-3/5 bg-brand-accent grid place-items-center">
              <Image src={PlaneWhiteLogo} alt="Plane White Logo" />
            </div>
            <div className="h-2/5 overflow-y-auto p-6">
              <h3 className="font-medium text-lg">
                Welcome to Plane, {user?.first_name} {user?.last_name}
              </h3>
              <p className="text-brand-secondary text-sm mt-3">
                We{"'"}re glad that you decided to try out Plane. You can now manage your projects
                with ease. Get started by creating a project.
              </p>
              <div className="flex items-center gap-6 mt-8">
                <PrimaryButton onClick={() => setStep("issues")}>Take a Product Tour</PrimaryButton>
                <button
                  type="button"
                  className="outline-brand-accent bg-transparent text-brand-accent text-xs font-medium"
                  onClick={onComplete}
                >
                  No thanks, I will explore it myself
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <button
            type="button"
            className="absolute top-[11.5%] right-[19%] border border-brand-secondary rounded-full p-1 translate-x-1/2 -translate-y-1/2 z-10 cursor-pointer"
            onClick={onComplete}
          >
            <XMarkIcon className="h-3 w-3 text-brand-base" />
          </button>
          <div className="w-3/5 h-3/4 bg-brand-base rounded-[10px] grid grid-cols-10 overflow-hidden">
            <TourSidebar step={step} setStep={setStep} />
            <div className="col-span-7 h-full overflow-hidden">
              <div className="relative h-3/5 grid place-items-center overflow-hidden bg-brand-accent">
                <Image
                  src={currentStep?.image}
                  className="absolute h-full w-full"
                  alt="Issues tour"
                />
              </div>
              <div className="flex flex-col h-2/5 overflow-y-auto p-4">
                <h3 className="font-medium text-lg">{currentStep?.title}</h3>
                <p className="text-brand-secondary text-sm mt-3">{currentStep?.description}</p>
                <div className="h-full flex items-end justify-between gap-4 mt-3">
                  <div className="flex items-center gap-4">
                    {currentStep?.prevStep && (
                      <SecondaryButton onClick={() => setStep(currentStep.prevStep ?? "welcome")}>
                        Back
                      </SecondaryButton>
                    )}
                    {currentStep?.nextStep && (
                      <PrimaryButton onClick={() => setStep(currentStep.nextStep ?? "issues")}>
                        Next
                      </PrimaryButton>
                    )}
                  </div>
                  {TOUR_STEPS.findIndex((tourStep) => tourStep.key === step) ===
                    TOUR_STEPS.length - 1 && (
                    <PrimaryButton onClick={onComplete}>Create my first project</PrimaryButton>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
