"use client";

import { FC } from "react";
// constants
import { IMPORTER_STEPS } from "@/plane-web/silo/jira/constants/steps";
// hooks
import { useImporter } from "@/plane-web/silo/jira/hooks";
// components
import { Stepper } from "@/plane-web/silo/ui";
// assets
import JiraLogo from "@/public/services/jira.svg";

export const StepsRoot: FC = () => {
  // hooks
  const { currentStepIndex } = useImporter();

  return (
    <div className="relative w-full h-full overflow-hidden">
      <Stepper logo={JiraLogo} steps={IMPORTER_STEPS} currentStepIndex={currentStepIndex} />
    </div>
  );
};
