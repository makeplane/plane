"use client";

import { FC } from "react";
import { observer } from "mobx-react";
// plane web components
import { Stepper } from "@/plane-web/components/importers/ui";
// plane web constants
import { IMPORTER_STEPS } from "@/plane-web/constants/importers";
// plane web hooks
import { useJiraImporter } from "@/plane-web/hooks/store";
// assets
import JiraLogo from "@/public/services/jira.svg";

export const StepsRoot: FC = observer(() => {
  // hooks
  const { currentStepIndex, resetImporterData } = useJiraImporter();

  return (
    <div className="relative w-full h-full overflow-hidden">
      <Stepper
        logo={JiraLogo}
        steps={IMPORTER_STEPS}
        currentStepIndex={currentStepIndex}
        redirectCallback={resetImporterData}
      />
    </div>
  );
});
