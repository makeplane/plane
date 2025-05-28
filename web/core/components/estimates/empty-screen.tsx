"use client";

import { FC } from "react";
import { useTheme } from "next-themes";
import { useTranslation } from "@plane/i18n";
// public images
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
      title={t("project_settings.empty_state.estimates.title")}
      description={t("project_settings.empty_state.estimates.description")}
      assetPath={resolvedPath}
      className="w-full !px-0 !py-4"
      primaryButton={{
        text: t("project_settings.empty_state.estimates.primary_button"),
        onClick: onButtonClick,
      }}
    />
  );
};
