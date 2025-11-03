"use client";

import type { FC } from "react";

// react-hook-form
import type { UseFormWatch } from "react-hook-form";
// ui
import { Button } from "@plane/propel/button";
// types
import type { TFormValues, TIntegrationSteps } from "@/components/integration";

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
