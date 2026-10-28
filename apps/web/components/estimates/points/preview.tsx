/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { DeleteOutline, DragDropOutline, EditOutline, MoreHorizontalOutline } from "@makeplane/propel/icons";
import { Icon } from "@makeplane/propel/components/icon";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@makeplane/propel/components/menu";
// plane imports
import { EEstimateSystem, estimateCount } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import type { TEstimatePointsObject, TEstimateSystemKeys, TEstimateTypeErrorObject } from "@plane/types";
import { convertMinutesToHoursMinutesString } from "@plane/utils";
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
    const estimatePointValueElement = EstimatePointValueRef.current;
    if (!estimatePointValueElement || estimatePointEditToggle || estimatePointDeleteToggle) return;

    const handleDoubleClick = () => setEstimatePointEditToggle(true);
    estimatePointValueElement.addEventListener("dblclick", handleDoubleClick);

    return () => {
      estimatePointValueElement.removeEventListener("dblclick", handleDoubleClick);
    };
  }, [estimatePointDeleteToggle, estimatePointEditToggle]);

  return (
    <div>
      {!estimatePointEditToggle && !estimatePointDeleteToggle && (
        <div className="group relative my-1 flex min-w-0 items-center justify-between gap-2 rounded-lg border border-subtle-1 bg-layer-2 px-3 py-2 text-primary hover:bg-layer-2-hover">
          <span
            aria-hidden="true"
            className="absolute top-1/2 -left-1.5 z-10 hidden -translate-y-1/2 cursor-grab items-center justify-center rounded border border-subtle-1 bg-layer-2 py-0.5 text-secondary transition-colors group-focus-within:flex group-hover:flex hover:bg-layer-2-hover hover:text-primary"
          >
            <DragDropOutline className="size-3" />
          </span>
          <div ref={EstimatePointValueRef} className="min-w-0 flex-1 truncate text-body-sm-medium">
            {estimatePoint?.value ? (
              `${estimateType === EEstimateSystem.TIME ? convertMinutesToHoursMinutesString(Number(estimatePoint?.value)) : estimatePoint?.value}`
            ) : (
              <span className="text-placeholder">{t("project_settings.estimates.create.enter_estimate_point")}</span>
            )}
          </div>
          <Menu>
            <MenuTrigger
              render={
                <IconButton
                  variant="ghost"
                  size="sm"
                  aria-label={t("aria_labels.common.more_actions")}
                  icon={<Icon icon={MoreHorizontalOutline} />}
                />
              }
            />
            <MenuContent side="bottom" align="end">
              <MenuItem
                icon={<Icon icon={EditOutline} />}
                label={t("edit")}
                onClick={() => setEstimatePointEditToggle(true)}
              />
              {estimatePoints.length > estimateCount.min && (
                <MenuItem
                  variant="danger"
                  icon={<Icon icon={DeleteOutline} />}
                  label={t("delete")}
                  onClick={() =>
                    estimateId && estimatePointId
                      ? setEstimatePointDeleteToggle(true)
                      : handleEstimatePointValueRemove && handleEstimatePointValueRemove()
                  }
                />
              )}
            </MenuContent>
          </Menu>
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
    </div>
  );
});
