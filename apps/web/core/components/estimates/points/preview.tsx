/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { GripVertical } from "lucide-react";
// plane imports
import { EEstimateSystem, estimateCount } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EditIcon, TrashIcon } from "@plane/propel/icons";
import type { TEstimatePointsObject, TEstimateSystemKeys, TEstimateTypeErrorObject } from "@plane/types";
import { convertMinutesToHoursMinutesString } from "@plane/utils";
// plane web imports
import { EstimatePointDelete } from "@/plane-web/components/estimates";
// local imports
import { EstimatePointUpdate } from "./update";

type TEstimatePointItemPreview = {
  workspaceSlug: string;
  projectId: string;
  estimateId: string | undefined;
  estimateType: TEstimateSystemKeys;
  estimatePointId: string | undefined;
  estimatePoint: TEstimatePointsObject;
  estimatePoints: TEstimatePointsObject[];
  handleEstimatePointValueUpdate?: (estimateValue: string) => void;
  handleEstimatePointValueRemove?: () => void;
  estimatePointError?: TEstimateTypeErrorObject | undefined;
  handleEstimatePointError?: (newValue: string, message: string | undefined) => void;
};

export const EstimatePointItemPreview = observer(function EstimatePointItemPreview(props: TEstimatePointItemPreview) {
  const {
    workspaceSlug,
    projectId,
    estimateId,
    estimateType,
    estimatePointId,
    estimatePoint,
    estimatePoints,
    handleEstimatePointValueUpdate,
    handleEstimatePointValueRemove,
    estimatePointError,
    handleEstimatePointError,
  } = props;
  // i18n
  const { t } = useTranslation();
  // state
  const [estimatePointEditToggle, setEstimatePointEditToggle] = useState(false);
  const [estimatePointDeleteToggle, setEstimatePointDeleteToggle] = useState(false);
  // ref
  const EstimatePointValueRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!estimatePointEditToggle && !estimatePointDeleteToggle)
      EstimatePointValueRef?.current?.addEventListener("dblclick", () => setEstimatePointEditToggle(true));
  }, [estimatePointDeleteToggle, estimatePointEditToggle]);

  return (
    <div>
      {!estimatePointEditToggle && !estimatePointDeleteToggle && (
        <div className="relative my-1 flex items-center gap-2 rounded-sm border border-subtle px-1 text-14">
          <div className="relative flex h-6 w-6 flex-shrink-0 cursor-pointer items-center justify-center rounded-xs transition-colors hover:bg-layer-1">
            <GripVertical size={14} className="text-secondary" />
          </div>
          <div ref={EstimatePointValueRef} className="w-full py-2 text-13">
            {estimatePoint?.value ? (
              `${estimateType === EEstimateSystem.TIME ? convertMinutesToHoursMinutesString(Number(estimatePoint?.value)) : estimatePoint?.value}`
            ) : (
              <span className="text-placeholder">{t("project_settings.estimates.create.enter_estimate_point")}</span>
            )}
          </div>
          <div
            className="relative flex h-6 w-6 flex-shrink-0 cursor-pointer items-center justify-center rounded-xs transition-colors hover:bg-layer-1"
            onClick={() => setEstimatePointEditToggle(true)}
          >
            <EditIcon width={14} height={14} className="text-secondary" />
          </div>
          {estimatePoints.length > estimateCount.min && (
            <div
              className="relative flex h-6 w-6 flex-shrink-0 cursor-pointer items-center justify-center rounded-xs transition-colors hover:bg-layer-1"
              onClick={() =>
                estimateId && estimatePointId
                  ? setEstimatePointDeleteToggle(true)
                  : handleEstimatePointValueRemove && handleEstimatePointValueRemove()
              }
            >
              <TrashIcon width={14} height={14} className="text-secondary" />
            </div>
          )}
        </div>
      )}

      {estimatePoint && estimatePointEditToggle && (
        <EstimatePointUpdate
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          estimateId={estimateId}
          estimateType={estimateType}
          estimatePointId={estimatePointId}
          estimatePoints={estimatePoints}
          estimatePoint={estimatePoint}
          handleEstimatePointValueUpdate={(estimatePointValue: string) =>
            handleEstimatePointValueUpdate && handleEstimatePointValueUpdate(estimatePointValue)
          }
          closeCallBack={() => setEstimatePointEditToggle(false)}
          estimatePointError={estimatePointError}
          handleEstimatePointError={handleEstimatePointError}
        />
      )}

      {estimateId && estimatePointId && estimatePointDeleteToggle && (
        <EstimatePointDelete
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          estimateId={estimateId}
          estimatePointId={estimatePointId}
          estimatePoints={estimatePoints}
          callback={() => estimateId && setEstimatePointDeleteToggle(false)}
          estimatePointError={estimatePointError}
          handleEstimatePointError={handleEstimatePointError}
          estimateSystem={estimateType}
        />
      )}
    </div>
  );
});
