"use client";

import { FC } from "react";
import { useTheme } from "next-themes";
import { PROJECT_SETTINGS_TRACKER_ELEMENTS, PROJECT_SETTINGS_TRACKER_EVENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
// public images
import { captureElementAndEvent } from "@/helpers/event-tracker.helper";
import { DetailedEmptyState } from "../empty-state";

type TEstimateEmptyScreen = {
  onButtonClick: () => void;
};

export const EstimateEmptyScreen: FC<TEstimateEmptyScreen> = (props) => {
  // props
  const { onButtonClick } = props;
  const { resolvedTheme } = useTheme();

  const { t } = useTranslation();

  const resolvedPath = `/empty-state/project-settings/estimates-${resolvedTheme === "light" ? "light" : "dark"}.png`;
  return (
    <DetailedEmptyState
      title={""}
      description={""}
      assetPath={resolvedPath}
      className="w-full !px-0 !py-0"
      primaryButton={{
        text: t("project_settings.empty_state.estimates.primary_button"),
        onClick: () => {
          onButtonClick();
          captureElementAndEvent({
            element: {
              elementName: PROJECT_SETTINGS_TRACKER_ELEMENTS.ESTIMATES_EMPTY_STATE_CREATE_BUTTON,
            },
            event: {
              eventName: PROJECT_SETTINGS_TRACKER_EVENTS.estimate_created,
              state: "SUCCESS",
            },
          });
        },
      }}
    />
  );
};
