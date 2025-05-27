"use client";

import { Fragment } from "react";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { Button } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";
// silo types
import { TStepper, TStepperNavigation } from "@/plane-web/types/importers";
import { useTranslation } from "@plane/i18n";

export const Stepper = <T,>(props: TStepper<T>) => {
  // props
  const { logo, steps, currentStepIndex, redirectCallback } = props;
  // derived value
  const currentStepDetails = steps[currentStepIndex];

  const { t } = useTranslation();

  return (
    <div className="relative w-full h-full flex flex-col space-y-6 overflow-hidden">
      <div className="space-y-6">
        {/* stepper header */}
        <div className="flex-shrink-0 relative flex items-center gap-2">
          {redirectCallback && (
            <div
              className="flex-shrink-0 relative flex justify-center items-center w-6 h-6 rounded overflow-hidden hover:bg-custom-background-90 cursor-pointer"
              onClick={redirectCallback}
            >
              <ArrowLeft size={16} />
            </div>
          )}

          <div className="w-full relative flex items-center gap-6">
            {logo && (
              <div className="flex-shrink-0 w-12 h-12 bg-custom-background-90 relative flex justify-center items-center rounded overflow-hidden">
                <Image src={logo} objectFit="contain" alt={`Importer Logo`} className="w-8 h-8" />
              </div>
            )}

            <div className="w-full h-full relative overflow-hidden flex justify-between items-center">
              {steps.map((step, index) => (
                <Fragment key={index}>
                  {/* left bar */}
                  {step?.prevStep && (
                    <div
                      className={cn("h-[1.5px] w-full bg-custom-border-200 transition-all", {
                        "bg-custom-primary-100": index <= currentStepIndex,
                      })}
                    />
                  )}

                  {/* content */}
                  <div
                    className={cn(
                      "flex-shrink-0 w-8 h-8 relative flex justify-center items-center border bg-custom-border-200 border-custom-border-200 text-custom-text-200 rounded-full transition-all",
                      {
                        "bg-custom-primary-100 border-custom-primary-100 text-white": index <= currentStepIndex,
                      }
                    )}
                  >
                    {step?.icon ? step?.icon() : index + 1}
                  </div>

                  {/* right bar */}
                  {step?.nextStep && index < steps.length - 1 && (
                    <div
                      className={cn("h-[1.5px] w-full bg-custom-border-200 transition-all", {
                        "bg-custom-primary-100": index < currentStepIndex,
                      })}
                    />
                  )}
                </Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* title and description */}
        <div className="flex-shrink-0 space-y-1">
          <div className="text-xl font-bold">{t(currentStepDetails?.i18n_title)}</div>
          <div className="text-custom-text-200 text-sm">{t(currentStepDetails?.i18n_description)}</div>
        </div>
      </div>

      {/* component */}
      {currentStepDetails?.component && <div className="h-full overflow-hidden">{currentStepDetails.component()}</div>}
    </div>
  );
};

export const StepperNavigation = <T,>(props: TStepperNavigation<T>) => {
  const { currentStep, handleStep, children } = props;

  // hooks
  const { t } = useTranslation();

  return (
    <div className="flex-shrink-0 relative flex items-center gap-2">
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
