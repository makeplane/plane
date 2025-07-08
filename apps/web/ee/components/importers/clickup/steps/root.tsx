"use client";

import { FC } from "react";
import { observer } from "mobx-react";
// plane web components
import { Stepper } from "@/plane-web/components/importers/ui";
// plane web constants
import { IMPORTER_CLICKUP_STEPS } from "@/plane-web/constants/importers/clickup";
// plane web hooks
import { useClickUpImporter } from "@/plane-web/hooks/store";
// assets
import ClickUpLogo from "@/public/services/clickup.svg";

export const StepsRoot: FC = observer(() => {
  // hooks
  const { currentStepIndex, resetImporterData } = useClickUpImporter();

  return (
    <div className="relative w-full h-full overflow-hidden">
      <Stepper
        serviceName="ClickUp"
        logo={ClickUpLogo}
        steps={IMPORTER_CLICKUP_STEPS}
        currentStepIndex={currentStepIndex}
        redirectCallback={resetImporterData}
      />
    </div>
  );
});
