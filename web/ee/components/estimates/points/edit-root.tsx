import { Dispatch, FC, Fragment, SetStateAction, useState } from "react";
import { observer } from "mobx-react";
import { ChevronLeft, Plus } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { TEstimatePointsObject, TEstimateTypeError, TEstimateUpdateStageKeys } from "@plane/types";
import { Button, Sortable, TOAST_TYPE, setToast } from "@plane/ui";
// components
import { EstimatePointItemPreview, EstimatePointCreate } from "@/components/estimates/points";
// hooks
import { useEstimate } from "@/hooks/store";
// plane web constants
import { EEstimateUpdateStages, estimateCount } from "@/plane-web/constants/estimates";

type TEstimatePointEditRoot = {
  workspaceSlug: string;
  projectId: string;
  estimateId: string;
  mode?: EEstimateUpdateStages;
  setEstimateEditType?: Dispatch<SetStateAction<TEstimateUpdateStageKeys | undefined>>;
  handleClose: () => void;
};

export const EstimatePointEditRoot: FC<TEstimatePointEditRoot> = observer((props) => {
  // props
  const { workspaceSlug, projectId, estimateId, setEstimateEditType, handleClose } = props;
  // hooks
  const { asJson: estimate, estimatePointIds, estimatePointById, updateEstimateSortOrder } = useEstimate(estimateId);
  const { t } = useTranslation();
  // states
  const [estimatePointCreate, setEstimatePointCreate] = useState<TEstimatePointsObject[] | undefined>(undefined);
  const [estimatePointError, setEstimatePointError] = useState<TEstimateTypeError>(undefined);

  const estimatePoints: TEstimatePointsObject[] =
    estimatePointIds && estimatePointIds.length > 0
      ? (estimatePointIds.map((estimatePointId: string) => {
          const estimatePoint = estimatePointById(estimatePointId);
          if (estimatePoint) return { id: estimatePointId, key: estimatePoint.key, value: estimatePoint.value };
        }) as TEstimatePointsObject[])
      : ([] as TEstimatePointsObject[]);

  const handleEstimatePointCreate = (mode: "add" | "remove", value: TEstimatePointsObject) => {
    switch (mode) {
      case "add":
        setEstimatePointCreate((prevValue) => {
          prevValue = prevValue ? [...prevValue] : [];
          return [...prevValue, value];
        });
        break;
      case "remove":
        setEstimatePointCreate((prevValue) => {
          prevValue = prevValue ? [...prevValue] : [];
          return prevValue.filter((item) => item.key !== value.key);
        });
        break;
      default:
        break;
    }
  };

  const handleDragEstimatePoints = async (updatedEstimatedOrder: TEstimatePointsObject[]) => {
    try {
      const updatedEstimateKeysOrder = updatedEstimatedOrder.map((item, index) => ({ ...item, key: index + 1 }));
      await updateEstimateSortOrder(workspaceSlug, projectId, updatedEstimateKeysOrder);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("estimates.toasts.reorder.success.title"),
        message: t("estimates.toasts.reorder.success.message"),
      });
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("estimates.toasts.reorder.error.title"),
        message: t("estimates.toasts.reorder.error.message"),
      });
    }
  };

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

  const handleCreate = () => {
    if (estimatePoints && estimatePoints.length + (estimatePointCreate?.length || 0) <= estimateCount.max - 1) {
      const currentKey = estimatePoints.length + (estimatePointCreate?.length || 0) + 1;
      handleEstimatePointCreate("add", {
        id: undefined,
        key: currentKey,
        value: "",
      });
      handleEstimatePointError && handleEstimatePointError(currentKey, "", "", undefined, "add");
    }
  };

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

  const handleEstimateDone = async () => {
    if (!validateEstimatePointError()) {
      handleClose();
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
            // NOTE: validate the estimate type
            newError[currentKey].message =
              newError[currentKey].message || t("project_settings.estimates.validation.remove_empty");
          }
        });
        return newError;
      });
    }
  };

  if (!workspaceSlug || !projectId || !estimateId) return <></>;
  return (
    <>
      <div className="relative flex justify-between items-center gap-2 px-5">
        <div className="relative flex items-center gap-1">
          <div
            onClick={() => setEstimateEditType && setEstimateEditType(undefined)}
            className="flex-shrink-0 cursor-pointer w-5 h-5 flex justify-center items-center"
          >
            <ChevronLeft className="w-4 h-4" />
          </div>
          <div className="text-xl font-medium text-custom-text-200">{t("project_settings.estimates.edit.title")}</div>
        </div>

        <Button variant="primary" size="sm" onClick={handleEstimateDone}>
          {t("common.done")}
        </Button>
      </div>

      <div className="space-y-3 px-5">
        <div className="text-sm font-medium text-custom-text-200 capitalize">{estimate?.type}</div>
        <div>
          <Sortable
            data={estimatePoints}
            render={(value: TEstimatePointsObject) => (
              <Fragment>
                {value?.id && estimate?.type ? (
                  <EstimatePointItemPreview
                    workspaceSlug={workspaceSlug}
                    projectId={projectId}
                    estimateId={estimateId}
                    estimatePointId={value?.id}
                    estimateType={estimate?.type}
                    estimatePoint={value}
                    estimatePoints={estimatePoints}
                    estimatePointError={estimatePointError?.[value.key] || undefined}
                    handleEstimatePointError={(
                      newValue: string,
                      message: string | undefined,
                      mode: "add" | "delete" = "add"
                    ) =>
                      handleEstimatePointError &&
                      handleEstimatePointError(value.key, value.value, newValue, message, mode)
                    }
                  />
                ) : null}
              </Fragment>
            )}
            onChange={(data: TEstimatePointsObject[]) => handleDragEstimatePoints(data)}
            keyExtractor={(item: TEstimatePointsObject) => item?.id?.toString() || item.value.toString()}
          />
        </div>

        {estimatePointCreate &&
          estimatePointCreate.map(
            (estimatePoint) =>
              estimate?.type && (
                <EstimatePointCreate
                  key={estimatePoint?.key}
                  workspaceSlug={workspaceSlug}
                  projectId={projectId}
                  estimateId={estimateId}
                  estimateType={estimate?.type}
                  closeCallBack={() => handleEstimatePointCreate("remove", estimatePoint)}
                  estimatePoints={estimatePoints}
                  handleCreateCallback={() => estimatePointCreate.length === 1 && handleCreate()}
                  estimatePointError={estimatePointError?.[estimatePoint.key] || undefined}
                  handleEstimatePointError={(
                    newValue: string,
                    message: string | undefined,
                    mode: "add" | "delete" = "add"
                  ) =>
                    handleEstimatePointError &&
                    handleEstimatePointError(estimatePoint.key, estimatePoint.value, newValue, message, mode)
                  }
                />
              )
          )}

        {estimatePoints && estimatePoints.length + (estimatePointCreate?.length || 0) <= estimateCount.max - 1 && (
          <Button variant="link-primary" size="sm" prependIcon={<Plus />} onClick={handleCreate}>
            Add {estimate?.type}
          </Button>
        )}
      </div>
    </>
  );
});
