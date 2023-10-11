import { useState } from "react";

import Image from "next/image";

// hooks
import useUser from "hooks/use-user";
// components
import { TourSidebar } from "components/onboarding";
// ui
import { Button } from "@plane/ui";
// icons
import { XMarkIcon } from "@heroicons/react/24/outline";
// images
import PlaneWhiteLogo from "public/plane-logos/white-horizontal.svg";
import IssuesTour from "public/onboarding/issues.webp";
import CyclesTour from "public/onboarding/cycles.webp";
import ModulesTour from "public/onboarding/modules.webp";
import ViewsTour from "public/onboarding/views.webp";
import PagesTour from "public/onboarding/pages.webp";

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
    title: "Plan with issues",
    description:
      "The issue is the building block of the Plane. Most concepts in Plane are either associated with issues and their properties.",
    image: IssuesTour,
    nextStep: "cycles",
  },
  {
    key: "cycles",
    title: "Move with cycles",
    description:
      "Cycles help you and your team to progress faster, similar to the sprints commonly used in agile development.",
    image: CyclesTour,
    prevStep: "issues",
    nextStep: "modules",
  },
  {
    key: "modules",
    title: "Break into modules",
    description: "Modules break your big thing into Projects or Features, to help you organize better.",
    image: ModulesTour,
    prevStep: "cycles",
    nextStep: "views",
  },
  {
    key: "views",
    title: "Views",
    description:
      "Create custom filters to display only the issues that matter to you. Save and share your filters in just a few clicks.",
    image: ViewsTour,
    prevStep: "modules",
    nextStep: "pages",
  },
  {
    key: "pages",
    title: "Document with pages",
    description: "Use Pages to quickly jot down issues when you're in a meeting or starting a day.",
    image: PagesTour,
    prevStep: "views",
  },
];

export const TourRoot: React.FC<Props> = ({ onComplete }) => {
  const [step, setStep] = useState<TTourSteps>("welcome");

  const { user } = useUser();

  const currentStepIndex = TOUR_STEPS.findIndex((tourStep) => tourStep.key === step);
  const currentStep = TOUR_STEPS[currentStepIndex];

  return (
    <>
      {step === "welcome" ? (
        <div className="w-4/5 md:w-1/2 lg:w-2/5 h-3/4 bg-custom-background-100 rounded-[10px] overflow-hidden">
          <div className="h-full overflow-hidden">
            <div className="h-3/5 bg-custom-primary-100 grid place-items-center">
              <Image src={PlaneWhiteLogo} alt="Plane White Logo" />
            </div>
            <div className="h-2/5 overflow-y-auto p-6">
              <h3 className="font-semibold sm:text-xl">
                Welcome to Plane, {user?.first_name} {user?.last_name}
              </h3>
              <p className="text-custom-text-200 text-sm mt-3">
                We{"'"}re glad that you decided to try out Plane. You can now manage your projects with ease. Get
                started by creating a project.
              </p>
              <div className="flex items-center gap-6 mt-8">
                <Button variant="primary" onClick={() => setStep("issues")}>
                  Take a Product Tour
                </Button>
                <button
                  type="button"
                  className="outline-custom-text-100 bg-transparent text-custom-primary-100 text-xs font-medium"
                  onClick={onComplete}
                >
                  No thanks, I will explore it myself
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative w-4/5 md:w-1/2 lg:w-3/5 h-3/5 sm:h-3/4 bg-custom-background-100 rounded-[10px] grid grid-cols-10 overflow-hidden">
          <button
            type="button"
            className="fixed top-[19%] sm:top-[11.5%] right-[9%] md:right-[24%] lg:right-[19%] border border-custom-text-100 rounded-full p-1 translate-x-1/2 -translate-y-1/2 z-10 cursor-pointer"
            onClick={onComplete}
          >
            <XMarkIcon className="h-3 w-3 text-custom-text-100" />
          </button>
          <TourSidebar step={step} setStep={setStep} />
          <div className="col-span-10 lg:col-span-7 h-full overflow-hidden">
            <div
              className={`flex items-end h-1/2 sm:h-3/5 overflow-hidden bg-custom-primary-100 ${
                currentStepIndex % 2 === 0 ? "justify-end" : "justify-start"
              }`}
            >
              <Image src={currentStep?.image} alt={currentStep?.title} />
            </div>
            <div className="flex flex-col h-1/2 sm:h-2/5 p-4 overflow-y-auto">
              <h3 className="font-semibold sm:text-xl">{currentStep?.title}</h3>
              <p className="text-custom-text-200 text-sm mt-3">{currentStep?.description}</p>
              <div className="h-full flex items-end justify-between gap-4 mt-3">
                <div className="flex items-center gap-4">
                  {currentStep?.prevStep && (
                    <Button variant="neutral-primary" onClick={() => setStep(currentStep.prevStep ?? "welcome")}>
                      Back
                    </Button>
                  )}
                  {currentStep?.nextStep && (
                    <Button variant="primary" onClick={() => setStep(currentStep.nextStep ?? "issues")}>
                      Next
                    </Button>
                  )}
                </div>
                {TOUR_STEPS.findIndex((tourStep) => tourStep.key === step) === TOUR_STEPS.length - 1 && (
                  <Button variant="primary" onClick={onComplete}>
                    Create my first project
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
