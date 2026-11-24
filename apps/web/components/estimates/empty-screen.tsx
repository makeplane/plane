/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTheme } from "next-themes";
// plane imports
import { useTranslation } from "@plane/i18n";
// components
import { DetailedEmptyState } from "@/components/empty-state/detailed-empty-state-root";

type TEstimateEmptyScreen = {
  onButtonClick: () => void;
};

export function EstimateEmptyScreen(props: TEstimateEmptyScreen) {
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
      className="w-full p-0!"
      primaryButton={{
        text: t("project_settings.empty_state.estimates.primary_button"),
        onClick: () => {
          onButtonClick();
        },
      }}
    />
  );
}
