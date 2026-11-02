/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { FormEvent } from "react";
import { useState } from "react";
import { observer } from "mobx-react";
import { InfoOutline } from "@makeplane/propel/icons";
import { Button } from "@makeplane/propel/components/button";
import { EEstimateSystem, MAX_ESTIMATE_POINT_INPUT_LENGTH } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { setToast } from "@plane/blocks/toast";
import { Tooltip } from "@makeplane/propel/components/tooltip";
import type { TEstimatePointsObject, TEstimateSystemKeys, TEstimateTypeErrorObject } from "@plane/types";
import { cn, isEstimatePointValuesRepeated } from "@plane/utils";
import { EstimateInputRoot } from "@/components/estimates/inputs/root";
// helpers
// hooks
import { useEstimate } from "@/hooks/store/estimates/use-estimate";
// plane web constants

type TEstimatePointCreate = {
  workspaceSlug: string;
  projectId: string;
  estimateId: string | undefined;
  estimateType: TEstimateSystemKeys;
  estimatePoints: TEstimatePointsObject[];
  handleEstimatePointValue?: (estimateValue: string) => void;
  closeCallBack: () => void;
  handleCreateCallback: () => void;
  estimatePointError?: TEstimateTypeErrorObject | undefined;
  handleEstimatePointError?: (newValue: string, message: string | undefined, mode?: "add" | "delete") => void;
};

export const EstimatePointCreate = observer(function EstimatePointCreate(props: TEstimatePointCreate) {
  const {
    workspaceSlug,
    projectId,
    estimateId,
    estimateType,
    estimatePoints,
    handleEstimatePointValue,
    closeCallBack,
    handleCreateCallback,
    estimatePointError,
    handleEstimatePointError,
  } = props;
  // hooks
  const { creteEstimatePoint } = useEstimate(estimateId);
  // i18n
  const { t } = useTranslation();
  // states
  const [estimateInputValue, setEstimateInputValue] = useState("");
  const [loader, setLoader] = useState(false);

  const handleSuccess = (value: string) => {
    handleEstimatePointValue && handleEstimatePointValue(value);
    setEstimateInputValue("");
    closeCallBack();
  };

  const handleClose = () => {
    handleEstimatePointError && handleEstimatePointError(estimateInputValue, undefined, "delete");
    setEstimateInputValue("");
    closeCallBack();
  };

  const handleEstimateInputValue = (value: string) => {
    if (value.length <= MAX_ESTIMATE_POINT_INPUT_LENGTH) {
      setEstimateInputValue(value);
      if (handleEstimatePointError) handleEstimatePointError(value, undefined);
    }
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!workspaceSlug || !projectId) return;

    if (handleEstimatePointError) handleEstimatePointError(estimateInputValue, undefined, "delete");

    if (estimateInputValue) {
      const currentEstimateType: EEstimateSystem | undefined = estimateType;
      let isEstimateValid = false;

      const currentEstimatePointValues = estimatePoints
        .map((point) => point?.value || undefined)
        .filter((value) => value != undefined);
      const isRepeated =
        (estimateType && isEstimatePointValuesRepeated(currentEstimatePointValues, estimateType, estimateInputValue)) ||
        false;

      if (!isRepeated) {
        if (currentEstimateType && [EEstimateSystem.TIME, EEstimateSystem.POINTS].includes(currentEstimateType)) {
          if (estimateInputValue && !isNaN(Number(estimateInputValue))) {
            if (Number(estimateInputValue) <= 0) {
              if (handleEstimatePointError)
                handleEstimatePointError(estimateInputValue, t("project_settings.estimates.validation.min_length"));
              return;
            } else {
              isEstimateValid = true;
            }
          }
        } else if (currentEstimateType && currentEstimateType === EEstimateSystem.CATEGORIES) {
          if (estimateInputValue && estimateInputValue.length > 0 && isNaN(Number(estimateInputValue))) {
            isEstimateValid = true;
          }
        }

        if (isEstimateValid) {
          if (estimateId != undefined) {
            try {
              setLoader(true);

              const payload = {
                key: estimatePoints?.length + 1,
                value: estimateInputValue,
              };
              await creteEstimatePoint(workspaceSlug, projectId, payload);

              setLoader(false);
              handleEstimatePointError && handleEstimatePointError(estimateInputValue, undefined, "delete");
              setToast({
                type: "success",
                title: t("project_settings.estimates.toasts.created.success.title"),
                message: t("project_settings.estimates.toasts.created.success.message"),
              });
              handleClose();
            } catch {
              setLoader(false);
              handleEstimatePointError &&
                handleEstimatePointError(
                  estimateInputValue,
                  t("project_settings.estimates.validation.unable_to_process")
                );
              setToast({
                type: "error",
                title: t("project_settings.estimates.toasts.created.error.title"),
                message: t("project_settings.estimates.toasts.created.error.message"),
              });
            }
          } else {
            handleSuccess(estimateInputValue);
            if (handleCreateCallback) {
              handleCreateCallback();
            }
          }
        } else {
          setLoader(false);
          handleEstimatePointError &&
            handleEstimatePointError(
              estimateInputValue,
              [EEstimateSystem.POINTS, EEstimateSystem.TIME].includes(estimateType)
                ? t("project_settings.estimates.validation.numeric")
                : t("project_settings.estimates.validation.character")
            );
        }
      } else
        handleEstimatePointError &&
          handleEstimatePointError(estimateInputValue, t("project_settings.estimates.validation.already_exists"));
    } else
      handleEstimatePointError &&
        handleEstimatePointError(estimateInputValue, t("project_settings.estimates.validation.empty"));
  };

  return (
    <form
      onSubmit={handleCreate}
      className="my-1 flex w-full scroll-m-8 items-center gap-2 rounded-lg border border-subtle-1 bg-layer-2 px-3 py-2 text-primary"
    >
      <div
        className={cn("relative flex min-w-0 flex-1 items-center gap-2 rounded-md", {
          "border border-danger-strong": estimatePointError?.message,
        })}
      >
        <EstimateInputRoot
          size="lg"
          estimateType={estimateType}
          handleEstimateInputValue={handleEstimateInputValue}
          value={estimateInputValue}
        />
        {estimatePointError?.message && (
          <Tooltip label={estimatePointError?.message} layout="stacked" side="bottom">
            <div className="relative mr-3 flex size-3.5 shrink-0 items-center justify-center overflow-hidden text-danger-primary">
              <InfoOutline width={14} height={14} />
            </div>
          </Tooltip>
        )}
      </div>

      <Button
        type="button"
        variant="ghost"
        size="lg"
        stretch="auto"
        onClick={handleClose}
        disabled={loader}
        label={t("cancel")}
      />
      <Button
        type="submit"
        variant="secondary"
        size="lg"
        stretch="auto"
        loading={loader}
        disabled={!estimateInputValue}
        label={loader ? t("adding") : t("add")}
      />
    </form>
  );
});
