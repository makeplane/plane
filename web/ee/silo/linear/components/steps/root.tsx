"use client";

import { FC } from "react";
// constants
import { IMPORTER_STEPS } from "@/plane-web/silo/linear/constants/steps";
// hooks
import { useImporter } from "@/plane-web/silo/linear/hooks";
// components
import { Stepper } from "@/plane-web/silo/ui";
// assets
import LinearLogo from "@/public/services/linear.svg";

export const StepsRoot: FC = () => {
  // hooks
  const { currentStepIndex } = useImporter();

  return (
    <div className="relative w-full h-full overflow-hidden">
      <Stepper logo={LinearLogo} steps={IMPORTER_STEPS} currentStepIndex={currentStepIndex} />
    </div>
  );
};
