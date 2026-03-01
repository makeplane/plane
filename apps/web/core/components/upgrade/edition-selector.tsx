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

import { useState } from "react";
// plane imports
import type { EExternalUpgradePlanType } from "@plane/constants";
import { EExternalUpgradeEditionType } from "@plane/constants";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { Button } from "@plane/propel/button";
import { getEditionUpgradePath } from "@plane/utils";
// components
import { RadioInput } from "@/components/estimates/radio-select";
// hooks
import { useAppRouter } from "@/hooks/use-app-router";

type TPlaneEditions = {
  [key in EExternalUpgradeEditionType]: {
    title: string;
    description: string;
  };
};

const PLANE_EDITIONS: TPlaneEditions = {
  [EExternalUpgradeEditionType.CLOUD]: {
    title: "Cloud account at app.plane.so",
    description: "You will log into your Plane account and select the workspace you want to upgrade",
  },
  [EExternalUpgradeEditionType.SELF_HOSTED]: {
    title: "Self-hosted Plane",
    description: "Choose this if you self-host the Community Edition or One",
  },
};

type EditionSelectorProps = {
  planType: EExternalUpgradePlanType;
};

export const EditionSelector = (props: EditionSelectorProps) => {
  const { planType } = props;
  // router
  const router = useAppRouter();
  // states
  const [selectedEdition, setSelectedEdition] = useState<EExternalUpgradeEditionType>(
    EExternalUpgradeEditionType.CLOUD
  );

  // Handles the next step in the upgrade process
  const handleNextStep = () => {
    if (!selectedEdition) {
      setToast({
        type: TOAST_TYPE.INFO,
        title: "Please select an edition to continue",
      });
      return;
    }

    router.push(getEditionUpgradePath(planType, selectedEdition));
  };

  return (
    <div className="w-full flex flex-col items-center justify-center gap-8">
      <RadioInput
        name="edition-radio-input"
        label="Choose your edition"
        options={Object.keys(PLANE_EDITIONS).map((edition) => ({
          label: (
            <div className="flex flex-col gap-2">
              <div className="flex gap-2 text-body-sm-medium">
                <div>{PLANE_EDITIONS[edition as EExternalUpgradeEditionType].title}</div>
              </div>
              <div className="text-body-xs-regular text-tertiary">
                {PLANE_EDITIONS[edition as EExternalUpgradeEditionType].description}
              </div>
            </div>
          ),
          value: edition as EExternalUpgradeEditionType,
        }))}
        className="w-full"
        labelClassName="text-center text-h3-semibold pb-6"
        wrapperClassName="w-full flex flex-col gap-4"
        fieldClassName="border border-strong shadow-raised-100 rounded-md py-4 px-6 items-start gap-3 bg-layer-2"
        buttonClassName="size-4 mt-1"
        selected={selectedEdition}
        onChange={(value) => setSelectedEdition(value as EExternalUpgradeEditionType)}
      />
      <Button onClick={handleNextStep} disabled={!selectedEdition} size="xl" className="w-full">
        Continue
      </Button>
    </div>
  );
};
