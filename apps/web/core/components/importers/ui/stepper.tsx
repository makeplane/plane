/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
// helpers
import { cn } from "@plane/utils";
// silo types
import type { TStepper, TStepperNavigation } from "@/types/importers";
import ImporterHeader from "../header";

export function Stepper<T>(props: TStepper<T>) {
  // props
  const { logo, steps, currentStepIndex, serviceName, renderStep } = props;

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
      <div className="border border-subtle rounded-lg flex divide-x divide-subtle overflow-hidden h-full">
        {/* stepper header */}
        <div className="relative flex gap-2 md:w-1/4 p-2 md:p-6 shrink-0 h-fit">
          <div className="w-full relative flex items-center gap-6">
            <div className="w-full h-full relative overflow-hidden flex flex-col justify-between">
              {steps.map((step, index) => (
                <div key={index}>
                  <div className="flex">
                    {/* indicator */}
                    <div
                      className={cn(
                        "relative shrink-0 w-5 h-5  flex justify-center items-center bg-transparent text-secondary rounded-full transition-all",
                        {
                          "bg-surface-2/10  text-on-color": index === currentStepIndex,
                        }
                      )}
                    >
                      <div
                        className={cn("text-13 font-medium w-2 h-2 rounded-full bg-layer-1", {
                          "bg-accent-primary": index <= currentStepIndex,
                        })}
                      />
                    </div>
                    {/* title */}
                    <div className="text-13 font-medium ml-4 hidden md:flex">{t(step?.i18n_title)}</div>
                  </div>
                  {/* right bar */}
                  {step?.nextStep && index < steps.length - 1 && (
                    <div
                      className={cn(" ml-[10px] h-[40px] w-[1px] bg-layer-2 transition-all", {
                        "bg-accent-primary": index < currentStepIndex,
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
          <div className="shrink-0 space-y-1 p-6">
            <div className="font-medium">{t(currentStepDetails?.i18n_title)}</div>
            <div className="text-secondary text-14">{t(currentStepDetails?.i18n_description)}</div>
          </div>
          {/* component */}
          {(renderStep || currentStepDetails?.component) && (
            <div className="h-full overflow-y-scroll flex flex-col justify-between mx-6">
              {renderStep ? renderStep(currentStepDetails.key) : currentStepDetails.component?.()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function StepperNavigation<T>(props: TStepperNavigation<T>) {
  const { currentStep, handleStep, children } = props;

  // hooks
  const { t } = useTranslation();

  return (
    <div className="shrink-0 relative flex items-center gap-2 w-full py-4 justify-between border-t border-subtle">
      <Button variant="secondary" onClick={() => handleStep("previous")} disabled={currentStep?.prevStep === undefined}>
        {t("common.back")}
      </Button>
      {children ? (
        children
      ) : (
        <Button variant="secondary" onClick={() => handleStep("next")} disabled={currentStep?.nextStep === undefined}>
          {t("common.next")}
        </Button>
      )}
    </div>
  );
}
