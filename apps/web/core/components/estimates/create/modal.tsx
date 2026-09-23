/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { EEstimateSystem, ESTIMATE_SYSTEMS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@makeplane/propel/components/button";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { ChevronLeftOutline } from "@makeplane/propel/icons";
import { setToast } from "@plane/blocks/toast";
import type { IEstimateFormData, TEstimateSystemKeys, TEstimatePointsObject, TEstimateTypeError } from "@plane/types";
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogHeading,
  DialogMain,
  DialogProgression,
  DialogTitle,
} from "@makeplane/propel/components/dialog";
// hooks
import { useProjectEstimates } from "@/hooks/store/estimates";
// local imports
import { EstimatePointCreateRoot } from "../points";
import { EstimateCreateStageOne } from "./stage-one";

type TCreateEstimateModal = {
  workspaceSlug: string;
  projectId: string;
  isOpen: boolean;
  handleClose: () => void;
};

export const CreateEstimateModal = observer(function CreateEstimateModal(props: TCreateEstimateModal) {
  // props
  const { workspaceSlug, projectId, isOpen, handleClose } = props;
  // hooks
  const { createEstimate } = useProjectEstimates();
  const { t } = useTranslation();
  // states
  const [estimateSystem, setEstimateSystem] = useState<TEstimateSystemKeys>(EEstimateSystem.POINTS);
  const [estimatePoints, setEstimatePoints] = useState<TEstimatePointsObject[] | undefined>(undefined);
  const [estimatePointError, setEstimatePointError] = useState<TEstimateTypeError>(undefined);
  const [buttonLoader, setButtonLoader] = useState(false);

  const handleUpdatePoints = (newPoints: TEstimatePointsObject[] | undefined) => setEstimatePoints(newPoints);

  const handleEstimatePointError = (
    key: number,
    oldValue: string,
    newValue: string,
    message: string | undefined,
    mode: "add" | "delete" = "add"
  ) => {
    setEstimatePointError((prev) => {
      if (mode === "add") {
        return { ...prev, [key]: { oldValue, newValue, message } };
      } else {
        const newError = { ...prev };
        delete newError[key];
        return newError;
      }
    });
  };

  useEffect(() => {
    if (isOpen) {
      setEstimateSystem(EEstimateSystem.POINTS);
      setEstimatePoints(undefined);
      setEstimatePointError([]);
    }
  }, [isOpen]);

  const validateEstimatePointError = () => {
    let estimateError = false;
    if (!estimatePointError) return estimateError;

    Object.keys(estimatePointError || {}).forEach((key) => {
      const currentKey = key as unknown as number;
      if (
        estimatePointError[currentKey]?.oldValue != estimatePointError[currentKey]?.newValue ||
        estimatePointError[currentKey]?.newValue === "" ||
        estimatePointError[currentKey]?.message
      ) {
        estimateError = true;
      }
    });

    return estimateError;
  };

  const handleCreateEstimate = async () => {
    if (!validateEstimatePointError()) {
      try {
        if (!workspaceSlug || !projectId || !estimatePoints) return;
        setButtonLoader(true);
        const payload: IEstimateFormData = {
          estimate: {
            name: ESTIMATE_SYSTEMS[estimateSystem]?.name,
            type: estimateSystem,
            last_used: true,
          },
          estimate_points: estimatePoints,
        };
        await createEstimate(workspaceSlug, projectId, payload);
        setButtonLoader(false);
        setToast({
          type: "success",
          title: t("project_settings.estimates.toasts.created.success.title"),
          message: t("project_settings.estimates.toasts.created.success.message"),
        });
        handleClose();
      } catch {
        setButtonLoader(false);
        setToast({
          type: "error",
          title: t("project_settings.estimates.toasts.created.error.title"),
          message: t("project_settings.estimates.toasts.created.error.message"),
        });
      }
    } else {
      setEstimatePointError((prev) => {
        const newError = { ...prev };
        Object.keys(newError || {}).forEach((key) => {
          const currentKey = key as unknown as number;
          if (
            newError[currentKey]?.newValue != "" &&
            newError[currentKey]?.oldValue === newError[currentKey]?.newValue
          ) {
            delete newError[currentKey];
          } else {
            newError[currentKey].message =
              newError[currentKey].message || t("project_settings.estimates.validation.remove_empty");
          }
        });
        return newError;
      });
    }
  };

  // derived values
  const renderEstimateStepsCount = useMemo(() => (estimatePoints ? "2" : "1"), [estimatePoints]);
  // const isEstimatePointError = useMemo(() => {
  //   if (!estimatePointError) return false;
  //   return Object.keys(estimatePointError).length > 0;
  // }, [estimatePointError]);

  return (
    <Dialog
      open={isOpen}
      disablePointerDismissal
      onOpenChange={(open, eventDetails) => {
        if (open) return;
        // The legacy modal took no `handleClose`, so Escape was swallowed: only Cancel closed it.
        if (eventDetails.reason === "escape-key") return;
        handleClose();
      }}
    >
      <DialogContent size="md">
        <DialogMain>
          {/* heading */}
          <DialogHeader>
            <DialogProgression>
              {estimatePoints && (
                <IconButton
                  variant="ghost"
                  size="xs"
                  aria-label={t("common.go_back")}
                  icon={<ChevronLeftOutline />}
                  onClick={() => {
                    setEstimateSystem(EEstimateSystem.POINTS);
                    handleUpdatePoints(undefined);
                  }}
                />
              )}
              {t("project_settings.estimates.create.step", {
                step: renderEstimateStepsCount,
                total: 2,
              })}
            </DialogProgression>
            <DialogHeading>
              <DialogTitle>{t("project_settings.estimates.new")}</DialogTitle>
            </DialogHeading>
          </DialogHeader>

          {/* estimate steps */}
          <DialogBody tabIndex={0}>
            {!estimatePoints && (
              <EstimateCreateStageOne
                estimateSystem={estimateSystem}
                handleEstimateSystem={setEstimateSystem}
                handleEstimatePoints={(templateType: string) =>
                  handleUpdatePoints(ESTIMATE_SYSTEMS[estimateSystem].templates[templateType].values)
                }
              />
            )}
            {estimatePoints && (
              <EstimatePointCreateRoot
                workspaceSlug={workspaceSlug}
                projectId={projectId}
                estimateId={undefined}
                estimateType={estimateSystem}
                estimatePoints={estimatePoints}
                setEstimatePoints={setEstimatePoints}
                estimatePointError={estimatePointError}
                handleEstimatePointError={handleEstimatePointError}
              />
            )}
            {/* {isEstimatePointError && (
            <div className="pt-5 text-body-xs-regular text-danger-primary">
              Estimate points can&apos;t be empty. Enter a value in each field or remove those you don&apos;t have
              values for.
            </div>
          )} */}
          </DialogBody>
        </DialogMain>

        <DialogActions>
          <Button
            variant="secondary"
            size="md"
            onClick={handleClose}
            disabled={buttonLoader}
            stretch="auto"
            label={t("common.cancel")}
          />
          {estimatePoints && (
            <Button
              variant="primary"
              size="md"
              onClick={handleCreateEstimate}
              disabled={buttonLoader}
              stretch="auto"
              label={buttonLoader ? t("common.creating") : t("project_settings.estimates.create.label")}
            />
          )}
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
});
