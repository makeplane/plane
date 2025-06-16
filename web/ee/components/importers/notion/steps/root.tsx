"use client";
import { FC, useEffect } from "react";
import { observer } from "mobx-react";
import { Stepper } from "@/plane-web/components/importers/ui";
// plane web constants
import { IMPORTER_STEPS } from "@/plane-web/constants/importers/notion";
// hooks
import { useNotionImporter } from "@/plane-web/hooks/store";
// assets
import NotionLogo from "@/public/services/notion.svg";

export const StepsRoot: FC = observer(() => {
  const { currentStepIndex, resetImporterData } = useNotionImporter();

  // Reset importer data if component is unmounted
  useEffect(
    () => () => {
      resetImporterData();
    },
    [resetImporterData]
  );

  return (
    <div className="relative w-full h-full overflow-hidden">
      <Stepper
        serviceName="Notion"
        logo={NotionLogo}
        steps={IMPORTER_STEPS}
        currentStepIndex={currentStepIndex}
        redirectCallback={resetImporterData}
      />
    </div>
  );
});
