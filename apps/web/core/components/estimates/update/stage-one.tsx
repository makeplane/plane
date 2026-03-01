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

import type { FC } from "react";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import type { TEstimateUpdateStageKeys } from "@plane/types";
// plane web constants
import { ESTIMATE_OPTIONS_STAGE_ONE } from "@/constants/estimates";

type TEstimateUpdateStageOne = {
  estimateEditType?: TEstimateUpdateStageKeys;
  handleClose: () => void;
  handleEstimateEditType?: (stage: TEstimateUpdateStageKeys) => void;
};

export function EstimateUpdateStageOne(props: TEstimateUpdateStageOne) {
  const { estimateEditType, handleClose, handleEstimateEditType } = props;
  const { t } = useTranslation();

  return (
    <>
      <div className="relative flex justify-between items-center gap-2 px-5">
        <div className="text-18 font-medium text-secondary">{t("project_settings.estimates.edit.title")}</div>
      </div>

      {!estimateEditType && (
        <div className="space-y-3 px-5">
          {ESTIMATE_OPTIONS_STAGE_ONE &&
            Object.keys(ESTIMATE_OPTIONS_STAGE_ONE).map((stage) => {
              const currentStage = stage as TEstimateUpdateStageKeys;
              return (
                <div
                  key={currentStage}
                  className="border border-subtle-1 cursor-pointer space-y-1 p-3 rounded-sm transition-colors"
                  onClick={() => handleEstimateEditType && handleEstimateEditType(currentStage)}
                >
                  <h3 className="text-14 font-medium">
                    {t(ESTIMATE_OPTIONS_STAGE_ONE?.[currentStage]?.i18n_title || "")}
                  </h3>
                  <p className="text-13 text-secondary">
                    {t(ESTIMATE_OPTIONS_STAGE_ONE?.[currentStage]?.i18n_description || "")}
                  </p>
                </div>
              );
            })}
        </div>
      )}

      <div className="relative flex justify-end items-center gap-3 px-5 pt-5 border-t border-subtle-1">
        <Button variant="secondary" onClick={handleClose}>
          {t("common.cancel")}
        </Button>
      </div>
    </>
  );
}
