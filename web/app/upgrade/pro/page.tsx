"use client";

import { useState } from "react";
// ui
import { Button, TOAST_TYPE, setToast } from "@plane/ui";
// components
import { RadioInput } from "@/components/estimates";
// hooks
import { useAppRouter } from "@/hooks/use-app-router";

type TPlaneEditions = {
  [key: string]: {
    title: string;
    description: string;
  };
};

const PLANE_EDITIONS: TPlaneEditions = {
  cloud: {
    title: "Cloud account at app.plane.so",
    description: "You will log into your Plane account and select the workspace you want to upgrade",
  },
  "self-hosted": {
    title: "Self-hosted Plane",
    description: "Choose this if you self-host the Community Edition or One",
  },
};

export default function UpgradePlanPage() {
  const router = useAppRouter();
  // states
  const [selectedEdition, setSelectedEdition] = useState<string>("cloud");

  const handleNextStep = () => {
    if (!selectedEdition) {
      setToast({
        type: TOAST_TYPE.INFO,
        title: "Please select an edition to continue",
      });
      return;
    }

    if (selectedEdition === "cloud") {
      router.push("/upgrade/pro/cloud");
    }
    if (selectedEdition === "self-hosted") {
      router.push("/upgrade/pro/self-hosted");
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-center gap-8">
      <RadioInput
        name="edition-radio-input"
        label="Choose your edition"
        options={Object.keys(PLANE_EDITIONS).map((edition) => ({
          label: (
            <div className="flex flex-col gap-2">
              <div className="flex gap-2 text-base font-medium">
                <div>{PLANE_EDITIONS[edition].title}</div>
              </div>
              <div className="text-sm text-onboarding-text-300">{PLANE_EDITIONS[edition].description}</div>
            </div>
          ),
          value: edition,
        }))}
        className="w-full"
        labelClassName="text-center text-3xl font-semibold pb-6"
        wrapperClassName="w-full flex flex-col gap-4"
        fieldClassName="border border-custom-border-200 rounded-md py-4 px-6 items-start gap-3"
        buttonClassName="size-5 mt-1"
        selected={selectedEdition}
        onChange={(value) => setSelectedEdition(value)}
      />
      <Button className="w-full px-2" onClick={handleNextStep} disabled={!selectedEdition}>
        Continue
      </Button>
    </div>
  );
}
