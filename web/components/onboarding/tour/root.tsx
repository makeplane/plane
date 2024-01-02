import { useState } from "react";
import Image from "next/image";
import { observer } from "mobx-react-lite";
import { X } from "lucide-react";
// hooks
import { useApplication, useUser } from "hooks/store";
// components
import { TourSidebar } from "components/onboarding";
// ui
import { Button } from "@plane/ui";
// assets
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

export const TourRoot: React.FC<Props> = observer((props) => {
  const { onComplete } = props;
  // states
  const [step, setStep] = useState<TTourSteps>("welcome");
  // store hooks
  const {
    commandPalette: commandPaletteStore,
    eventTracker: { setTrackElement },
  } = useApplication();
  const { currentUser } = useUser();

  const currentStepIndex = TOUR_STEPS.findIndex((tourStep) => tourStep.key === step);
  const currentStep = TOUR_STEPS[currentStepIndex];

  return (
    <>
      {step === "welcome" ? (
        <div className="h-3/4 w-4/5 overflow-hidden rounded-[10px] bg-custom-background-100 md:w-1/2 lg:w-2/5">
          <div className="h-full overflow-hidden">
            <div className="grid h-3/5 place-items-center bg-custom-primary-100">
              <Image src={PlaneWhiteLogo} alt="Plane White Logo" />
            </div>
            <div className="flex h-2/5 flex-col overflow-y-auto p-6">
              <h3 className="font-semibold sm:text-xl">
                Welcome to Plane, {currentUser?.first_name} {currentUser?.last_name}
              </h3>
              <p className="mt-3 text-sm text-custom-text-200">
                We{"'"}re glad that you decided to try out Plane. You can now manage your projects with ease. Get
                started by creating a project.
              </p>
              <div className="flex h-full items-end">
                <div className="mt-8 flex items-center gap-6">
                  <Button variant="primary" onClick={() => setStep("issues")}>
                    Take a Product Tour
                  </Button>
                  <button
                    type="button"
                    className="bg-transparent text-xs font-medium text-custom-primary-100 outline-custom-text-100"
                    onClick={onComplete}
                  >
                    No thanks, I will explore it myself
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative grid h-3/5 w-4/5 grid-cols-10 overflow-hidden rounded-[10px] bg-custom-background-100 sm:h-3/4 md:w-1/2 lg:w-3/5">
          <button
            type="button"
            className="fixed right-[9%] top-[19%] z-10 -translate-y-1/2 translate-x-1/2 cursor-pointer rounded-full border border-custom-text-100 p-1 sm:top-[11.5%] md:right-[24%] lg:right-[19%]"
            onClick={onComplete}
          >
            <X className="h-3 w-3 text-custom-text-100" />
          </button>
          <TourSidebar step={step} setStep={setStep} />
          <div className="col-span-10 h-full overflow-hidden lg:col-span-7">
            <div
              className={`flex h-1/2 items-end overflow-hidden bg-custom-primary-100 sm:h-3/5 ${
                currentStepIndex % 2 === 0 ? "justify-end" : "justify-start"
              }`}
            >
              <Image src={currentStep?.image} alt={currentStep?.title} />
            </div>
            <div className="flex h-1/2 flex-col overflow-y-auto p-4 sm:h-2/5">
              <h3 className="font-semibold sm:text-xl">{currentStep?.title}</h3>
              <p className="mt-3 text-sm text-custom-text-200">{currentStep?.description}</p>
              <div className="mt-3 flex h-full items-end justify-between gap-4">
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
                {currentStepIndex === TOUR_STEPS.length - 1 && (
                  <Button
                    variant="primary"
                    onClick={() => {
                      onComplete();
                      setTrackElement("ONBOARDING_TOUR");
                      commandPaletteStore.toggleCreateProjectModal(true);
                    }}
                  >
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
});
