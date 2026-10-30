/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTranslation } from "@plane/i18n";
import { useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { Button } from "@makeplane/propel/components/button";
import { PlaneLockup } from "@plane/blocks/icons";
import { CloseOutline } from "@makeplane/propel/icons";
// assets
import CyclesTour from "@/app/assets/onboarding/cycles.webp?url";
import IssuesTour from "@/app/assets/onboarding/issues.webp?url";
import ModulesTour from "@/app/assets/onboarding/modules.webp?url";
import PagesTour from "@/app/assets/onboarding/pages.webp?url";
import ViewsTour from "@/app/assets/onboarding/views.webp?url";
// hooks
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useUser } from "@/hooks/store/user";
// local imports
import { TourSidebar } from "./sidebar";

export type TOnboardingTourProps = {
  onComplete: () => void;
};

export type TTourSteps = "welcome" | "work-items" | "cycles" | "modules" | "views" | "pages";

export const TourRoot = observer(function TourRoot(props: TOnboardingTourProps) {
  const { t } = useTranslation();
  const TOUR_STEPS: {
    key: TTourSteps;
    title: string;
    description: string;
    image: string;
    prevStep?: TTourSteps;
    nextStep?: TTourSteps;
  }[] = [
    {
      key: "work-items",
      title: t("web_ui.plan_with_work_items"),
      description: t(
        "web_ui.the_work_item_is_the_building_block_of_the_plane_most_concepts_in_plane_are_either_associa"
      ),
      image: IssuesTour,
      nextStep: "cycles",
    },
    {
      key: "cycles",
      title: t("web_ui.move_with_cycles"),
      description: t(
        "web_ui.cycles_help_you_and_your_team_to_progress_faster_similar_to_the_sprints_commonly_used_in_a"
      ),
      image: CyclesTour,
      prevStep: "work-items",
      nextStep: "modules",
    },
    {
      key: "modules",
      title: t("web_ui.break_into_modules"),
      description: t("web_ui.modules_break_your_big_thing_into_projects_or_features_to_help_you_organize_better"),
      image: ModulesTour,
      prevStep: "cycles",
      nextStep: "views",
    },
    {
      key: "views",
      title: t("views"),
      description: t(
        "web_ui.create_custom_filters_to_display_only_the_work_items_that_matter_to_you_save_and_share_you"
      ),
      image: ViewsTour,
      prevStep: "modules",
      nextStep: "pages",
    },
    {
      key: "pages",
      title: t("web_ui.document_with_pages"),
      description: t("web_ui.use_pages_to_quickly_jot_down_work_items_when_you_re_in_a_meeting_or_starting_a_day"),
      image: PagesTour,
      prevStep: "views",
    },
  ];

  const { onComplete } = props;
  // states
  const [step, setStep] = useState<TTourSteps>("welcome");
  // store hooks
  const { toggleCreateProjectModal } = useCommandPalette();
  const { data: currentUser } = useUser();

  const currentStepIndex = TOUR_STEPS.findIndex((tourStep) => tourStep.key === step);
  const currentStep = TOUR_STEPS[currentStepIndex];

  return (
    <>
      {step === "welcome" ? (
        <div className="w-4/5 overflow-hidden rounded-[10px] bg-surface-1 md:w-1/2 lg:w-2/5">
          <div className="h-full overflow-hidden">
            <div className="grid h-64 place-items-center bg-accent-primary">
              <PlaneLockup className="h-10 w-auto text-on-color" />
            </div>
            <div className="flex flex-col overflow-y-auto p-6">
              <h3 className="font-semibold sm:text-18">
                {t("web_ui.welcome_to_plane")} {currentUser?.first_name} {currentUser?.last_name}
              </h3>
              <p className="mt-3 text-13 text-secondary">{t("web_ui.welcome_description")}</p>
              <div className="flex h-full items-end">
                <div className="mt-12 flex items-center gap-6">
                  <Button
                    variant="primary"
                    size="sm"
                    stretch="auto"
                    label={t("web_ui.take_a_product_tour")}
                    onClick={() => {
                      setStep("work-items");
                    }}
                  />
                  <button
                    type="button"
                    className="bg-transparent text-11 font-medium text-accent-primary outline-subtle-1"
                    onClick={() => {
                      onComplete();
                    }}
                  >
                    {t("web_ui.no_thanks_i_will_explore_it_myself")}{" "}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative grid h-3/5 w-4/5 grid-cols-10 overflow-hidden rounded-[10px] bg-surface-1 sm:h-3/4 md:w-1/2 lg:w-3/5">
          <button
            type="button"
            className="fixed top-[19%] right-[9%] z-10 translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full border border-strong bg-surface-1 p-1 sm:top-[11.5%] md:right-[24%] lg:right-[19%]"
            onClick={onComplete}
          >
            <CloseOutline className="border-strong- h-3 w-3 text-primary" />
          </button>
          <TourSidebar step={step} setStep={setStep} />
          <div className="col-span-10 h-full overflow-hidden lg:col-span-7">
            <div
              className={`flex h-1/2 items-end overflow-hidden bg-accent-primary sm:h-3/5 ${
                currentStepIndex % 2 === 0 ? "justify-end" : "justify-start"
              }`}
            >
              <img src={currentStep?.image} className="h-full w-full object-cover" alt={currentStep?.title} />
            </div>
            <div className="flex h-1/2 flex-col overflow-y-auto p-4 sm:h-2/5">
              <h3 className="font-semibold sm:text-18">{currentStep?.title}</h3>
              <p className="mt-3 text-13 text-secondary">{currentStep?.description}</p>
              <div className="mt-3 flex h-full items-end justify-between gap-4">
                <div className="flex items-center gap-4">
                  {currentStep?.prevStep && (
                    <Button
                      variant="secondary"
                      size="sm"
                      stretch="auto"
                      label={t("common.back")}
                      onClick={() => setStep(currentStep.prevStep ?? "welcome")}
                    />
                  )}
                  {currentStep?.nextStep && (
                    <Button
                      variant="primary"
                      size="sm"
                      stretch="auto"
                      label={t("next")}
                      onClick={() => setStep(currentStep.nextStep ?? "work-items")}
                    />
                  )}
                </div>
                {currentStepIndex === TOUR_STEPS.length - 1 && (
                  <Button
                    variant="primary"
                    size="sm"
                    stretch="auto"
                    label={t("web_ui.create_your_first_project")}
                    onClick={() => {
                      onComplete();
                      toggleCreateProjectModal(true);
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
});
