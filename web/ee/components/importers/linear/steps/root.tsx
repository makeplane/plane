"use client";

import { FC } from "react";
import { observer } from "mobx-react";
// plane web components
import { Stepper } from "@/plane-web/components/importers/ui";
// plane web constants
import { IMPORTER_LINEAR_STEPS } from "@/plane-web/constants/importers/linear";
// plane web hooks
import { useLinearImporter } from "@/plane-web/hooks/store";
// assets
import LinearLogo from "@/public/services/linear.svg";

export const StepsRoot: FC = observer(() => {
  // hooks
  const { currentStepIndex, resetImporterData } = useLinearImporter();

  return (
    <div className="relative w-full h-full overflow-hidden">
      <Stepper
        logo={LinearLogo}
        steps={IMPORTER_LINEAR_STEPS}
        currentStepIndex={currentStepIndex}
        redirectCallback={resetImporterData}
      />
    </div>
  );
});
