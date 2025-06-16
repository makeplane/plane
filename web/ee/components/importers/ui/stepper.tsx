"use client";

import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/ui";
// helpers
import { cn  } from "@plane/utils";
// silo types
import { TStepper, TStepperNavigation } from "@/plane-web/types/importers";
import ImporterHeader from "../header";

export const Stepper = <T,>(props: TStepper<T>) => {
  // props
  const { logo, steps, currentStepIndex, serviceName } = props;

  // derived value
  const currentStepDetails = steps[currentStepIndex];

  const { t } = useTranslation();

  return (
    <div className="relative w-full h-full flex flex-col space-y-6 overflow-hidden">
      <ImporterHeader
        config={{
          serviceName,
          logo,
        }}
      />
      <div className="border border-custom-border-100 rounded-lg flex divide-x divide-custom-border-100 overflow-hidden h-full">
        {/* stepper header */}
        <div className="relative flex gap-2 md:w-1/4 p-2 md:p-6 flex-shrink-0 h-fit">
          <div className="w-full relative flex items-center gap-6">
            <div className="w-full h-full relative overflow-hidden flex flex-col justify-between">
              {steps.map((step, index) => (
                <div key={index}>
                  <div className="flex">
                    {/* indicator */}
                    <div
                      className={cn(
                        "relative flex-shrink-0 w-5 h-5  flex justify-center items-center bg-transparent text-custom-text-200 rounded-full transition-all",
                        {
                          "bg-custom-primary-90/10  text-white": index === currentStepIndex,
                        }
                      )}
                    >
                      <div
                        className={cn("text-sm font-medium w-2 h-2 rounded-full bg-custom-border-200", {
                          "bg-custom-primary-100": index <= currentStepIndex,
                        })}
                      />
                    </div>
                    {/* title */}
                    <div className="text-sm font-medium ml-4 hidden md:flex">{t(step?.i18n_title)}</div>
                  </div>
                  {/* right bar */}
                  {step?.nextStep && index < steps.length - 1 && (
                    <div
                      className={cn(" ml-[10px] h-[40px] w-[1px] bg-custom-border-100 transition-all", {
                        "bg-custom-primary-100": index < currentStepIndex,
                      })}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* content */}
        <div className="md:w-3/4 h-full flex flex-col overflow-auto">
          {/* title and description */}
          <div className="flex-shrink-0 space-y-1 p-6">
            <div className="font-medium">{t(currentStepDetails?.i18n_title)}</div>
            <div className="text-custom-text-200 text-base">{t(currentStepDetails?.i18n_description)}</div>
          </div>
          {/* component */}
          {currentStepDetails?.component && (
            <div className="h-full overflow-y-scroll flex flex-col justify-between mx-6">
              {currentStepDetails.component()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const StepperNavigation = <T,>(props: TStepperNavigation<T>) => {
  const { currentStep, handleStep, children } = props;

  // hooks
  const { t } = useTranslation();

  return (
    <div className="flex-shrink-0 relative flex items-center gap-2 w-full py-4 justify-between border-t border-custom-border-100">
      <Button
        variant="neutral-primary"
        size="sm"
        onClick={() => handleStep("previous")}
        disabled={currentStep?.prevStep === undefined}
      >
        {t("common.back")}
      </Button>
      {children ? (
        children
      ) : (
        <Button
          variant="neutral-primary"
          size="sm"
          onClick={() => handleStep("next")}
          disabled={currentStep?.nextStep === undefined}
        >
          {t("common.next")}
        </Button>
      )}
    </div>
  );
};
