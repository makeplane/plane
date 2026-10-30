/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane imports
import { useTranslation } from "@plane/i18n";
import { CyclesOutline, ModuleOutline, PagesOutline, ViewsOutline, WorkItemsOutline } from "@makeplane/propel/icons";
import type { ISvgIcons } from "@plane/blocks/icons";
// types
import type { TTourSteps } from "./root";

type Props = {
  step: TTourSteps;
  setStep: React.Dispatch<React.SetStateAction<TTourSteps>>;
};

export function TourSidebar({ step, setStep }: Props) {
  const { t } = useTranslation();
  const sidebarOptions: {
    key: TTourSteps;
    label: string;
    Icon: React.FC<ISvgIcons>;
  }[] = [
    {
      key: "work-items",
      label: t("issues"),
      Icon: WorkItemsOutline,
    },
    {
      key: "cycles",
      label: t("cycles"),
      Icon: CyclesOutline,
    },
    {
      key: "modules",
      label: t("modules"),
      Icon: ModuleOutline,
    },
    {
      key: "views",
      label: t("views"),
      Icon: ViewsOutline,
    },
    {
      key: "pages",
      label: t("pages"),
      Icon: PagesOutline,
    },
  ];

  return (
    <div className="col-span-3 hidden bg-surface-2 p-8 lg:block">
      <h3 className="text-16 font-medium">
        {t("web_ui.lets_get_started")}
        <br />
        {t("web_ui.get_more_out_of_plane")}{" "}
      </h3>
      <div className="mt-8 space-y-5">
        {sidebarOptions.map((option) => (
          // oxlint-disable-next-line jsx_a11y/click-events-have-key-events
          <h5
            key={option.key}
            className={`flex cursor-pointer items-center gap-2 border-l-[3px] py-0.5 pr-2 pl-3 text-13 font-medium capitalize ${
              step === option.key ? "border-accent-strong text-accent-primary" : "border-transparent text-secondary"
            }`}
            onClick={() => setStep(option.key)}
            // oxlint-disable-next-line jsx_a11y/prefer-tag-over-role
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
