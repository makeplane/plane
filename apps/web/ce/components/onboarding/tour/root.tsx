import { useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { PRODUCT_TOUR_TRACKER_ELEMENTS } from "@plane/constants";
import { Button } from "@plane/propel/button";
import { CloseIcon, PlaneLockup } from "@plane/propel/icons";
// assets
import CyclesTour from "@/app/assets/onboarding/cycles.webp?url";
import IssuesTour from "@/app/assets/onboarding/issues.webp?url";
import ModulesTour from "@/app/assets/onboarding/modules.webp?url";
import PagesTour from "@/app/assets/onboarding/pages.webp?url";
import ViewsTour from "@/app/assets/onboarding/views.webp?url";
// hooks
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useUser } from "@/hooks/store/user";
// local imports
import { TourSidebar } from "./sidebar";

export type TOnboardingTourProps = {
  onComplete: () => void;
};

export type TTourSteps = "welcome" | "work-items" | "cycles" | "modules" | "views" | "pages";

const TOUR_STEPS: {
  key: TTourSteps;
  title: string;
  description: string;
  image: string;
  prevStep?: TTourSteps;
  nextStep?: TTourSteps;
}[] = [
  {
    key: "work-items",
    title: "Plan with work items",
    description:
      "The work item is the building block of the Plane. Most concepts in Plane are either associated with work items and their properties.",
    image: IssuesTour,
    nextStep: "cycles",
  },
  {
    key: "cycles",
    title: "Move with cycles",
    description:
      "Cycles help you and your team to progress faster, similar to the sprints commonly used in agile development.",
    image: CyclesTour,
    prevStep: "work-items",
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
      "Create custom filters to display only the work items that matter to you. Save and share your filters in just a few clicks.",
    image: ViewsTour,
    prevStep: "modules",
    nextStep: "pages",
  },
  {
    key: "pages",
    title: "Document with pages",
    description: "Use Pages to quickly jot down work items when you're in a meeting or starting a day.",
    image: PagesTour,
    prevStep: "views",
  },
];

export const TourRoot = observer(function TourRoot(props: TOnboardingTourProps) {
  const { onComplete } = props;
  // states
  const [step, setStep] = useState<TTourSteps>("welcome");
  // store hooks
  const { toggleCreateProjectModal } = useCommandPalette();
  const { data: currentUser } = useUser();

  const currentStepIndex = TOUR_STEPS.findIndex((tourStep) => tourStep.key === step);
  const currentStep = TOUR_STEPS[currentStepIndex];

  return (
    <>
      {step === "welcome" ? (
        <div className="w-4/5 overflow-hidden rounded-[10px] bg-surface-1 md:w-1/2 lg:w-2/5">
          <div className="h-full overflow-hidden">
            <div className="grid h-64 place-items-center bg-accent-primary">
              <PlaneLockup className="h-10 w-auto text-on-color" />
            </div>
            <div className="flex flex-col overflow-y-auto p-6">
              <h3 className="font-semibold sm:text-18">
                Welcome to Plane, {currentUser?.first_name} {currentUser?.last_name}
              </h3>
              <p className="mt-3 text-13 text-secondary">
                We{"'"}re glad that you decided to try out Plane. You can now manage your projects with ease. Get
                started by creating a project.
              </p>
              <div className="flex h-full items-end">
                <div className="mt-12 flex items-center gap-6">
                  <Button
                    variant="primary"
                    onClick={() => {
                      setStep("work-items");
                    }}
                  >
                    Take a Product Tour
                  </Button>
                  <button
                    type="button"
                    className="bg-transparent text-11 font-medium text-accent-primary outline-subtle-1"
                    onClick={() => {
                      onComplete();
                    }}
                  >
                    No thanks, I will explore it myself
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative grid h-3/5 w-4/5 grid-cols-10 overflow-hidden rounded-[10px] bg-surface-1 sm:h-3/4 md:w-1/2 lg:w-3/5">
          <button
            type="button"
            className="fixed right-[9%] top-[19%] z-10 -translate-y-1/2 translate-x-1/2 cursor-pointer rounded-full border border-strong p-1 sm:top-[11.5%] md:right-[24%] lg:right-[19%]"
            onClick={onComplete}
          >
            <CloseIcon className="h-3 w-3 text-primary border-strong-" />
          </button>
          <TourSidebar step={step} setStep={setStep} />
          <div className="col-span-10 h-full overflow-hidden lg:col-span-7">
            <div
              className={`flex h-1/2 items-end overflow-hidden bg-accent-primary sm:h-3/5 ${
                currentStepIndex % 2 === 0 ? "justify-end" : "justify-start"
              }`}
            >
              <img src={currentStep?.image} className="w-full h-full object-cover" alt={currentStep?.title} />
            </div>
            <div className="flex h-1/2 flex-col overflow-y-auto p-4 sm:h-2/5">
              <h3 className="font-semibold sm:text-18">{currentStep?.title}</h3>
              <p className="mt-3 text-13 text-secondary">{currentStep?.description}</p>
              <div className="mt-3 flex h-full items-end justify-between gap-4">
                <div className="flex items-center gap-4">
                  {currentStep?.prevStep && (
                    <Button variant="secondary" onClick={() => setStep(currentStep.prevStep ?? "welcome")}>
                      Back
                    </Button>
                  )}
                  {currentStep?.nextStep && (
                    <Button variant="primary" onClick={() => setStep(currentStep.nextStep ?? "work-items")}>
                      Next
                    </Button>
                  )}
                </div>
                {currentStepIndex === TOUR_STEPS.length - 1 && (
                  <Button
                    variant="primary"
                    onClick={() => {
                      onComplete();
                      toggleCreateProjectModal(true);
                    }}
                  >
                    Create your first project
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
