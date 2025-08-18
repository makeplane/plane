"use client";

import { FC } from "react";
// plane web components
import { observer } from "mobx-react";
import { Stepper } from "@/plane-web/components/importers/ui";
// plane web constants
import { IMPORTER_STEPS } from "@/plane-web/constants/importers/asana";
// plane web hooks
import { useAsanaImporter } from "@/plane-web/hooks/store";
// assets
import AsanaLogo from "@/public/services/asana.svg";

export const StepsRoot: FC = observer(() => {
  // hooks
  const { currentStepIndex, resetImporterData } = useAsanaImporter();

  return (
    <div className="relative w-full h-full overflow-hidden">
      <Stepper
        serviceName="Asana"
        logo={AsanaLogo}
        steps={IMPORTER_STEPS}
        currentStepIndex={currentStepIndex}
        redirectCallback={resetImporterData}
      />
    </div>
  );
});
