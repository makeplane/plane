/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane imports
import { CycleIcon, ModuleIcon, PageIcon, ViewsIcon, WorkItemsIcon } from "@plane/propel/icons";
import { useTranslation } from "@plane/i18n";
import type { ISvgIcons } from "@plane/propel/icons";
// types
import type { TTourSteps } from "./root";

const sidebarOptions: {
  key: TTourSteps;
  labelKey: string;
  Icon: React.FC<ISvgIcons>;
}[] = [
  {
    key: "work-items",
    labelKey: "onboarding.tour.sidebar.options.work_items",
    Icon: WorkItemsIcon,
  },
  {
    key: "cycles",
    labelKey: "onboarding.tour.sidebar.options.cycles",
    Icon: CycleIcon,
  },
  {
    key: "modules",
    labelKey: "onboarding.tour.sidebar.options.modules",
    Icon: ModuleIcon,
  },
  {
    key: "views",
    labelKey: "onboarding.tour.sidebar.options.views",
    Icon: ViewsIcon,
  },
  {
    key: "pages",
    labelKey: "onboarding.tour.sidebar.options.pages",
    Icon: PageIcon,
  },
];

type Props = {
  step: TTourSteps;
  setStep: React.Dispatch<React.SetStateAction<TTourSteps>>;
};

export function TourSidebar({ step, setStep }: Props) {
  const { t } = useTranslation();
  return (
    <div className="col-span-3 hidden bg-surface-2 p-8 lg:block">
      <h3 className="text-16 font-medium">
        {t("onboarding.tour.sidebar.heading")}
        <br />
        {t("onboarding.tour.sidebar.subheading")}
      </h3>
      <div className="mt-8 space-y-5">
        {sidebarOptions.map((option) => (
          <h5
            key={option.key}
            className={`flex cursor-pointer items-center gap-2 border-l-[3px] py-0.5 pl-3 pr-2 text-13 font-medium capitalize ${
              step === option.key ? "border-accent-strong text-accent-primary" : "border-transparent text-secondary"
            }`}
            onClick={() => setStep(option.key)}
            role="button"
          >
            <option.Icon className="h-4 w-4" aria-hidden="true" />
            {option.label}
          </h5>
        ))}
      </div>
    </div>
  );
}
