"use client";

import { FC } from "react";

// react-hook-form
import { UseFormWatch } from "react-hook-form";
// ui
import { Button } from "@plane/ui";
// types
import { TFormValues, TIntegrationSteps } from "@/components/integration";

type Props = {
  handleStepChange: (value: TIntegrationSteps) => void;
  watch: UseFormWatch<TFormValues>;
};

export const GithubImportConfirm: FC<Props> = ({ handleStepChange, watch }) => (
  <div className="mt-6">
    <h4 className="font-medium text-custom-text-200">
      You are about to import work items from {watch("github").full_name}. Click on {'"'}Confirm & Import{'" '}
      to complete the process.
    </h4>
    <div className="mt-6 flex items-center justify-between">
      <Button variant="neutral-primary" onClick={() => handleStepChange("import-users")}>
        Back
      </Button>
      <Button variant="primary" type="submit">
        Confirm & Import
      </Button>
    </div>
  </div>
);
