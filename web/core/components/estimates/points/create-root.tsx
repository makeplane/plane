"use client";

import { Dispatch, FC, SetStateAction, useCallback, useState } from "react";
import { observer } from "mobx-react";
import { Plus } from "lucide-react";
import { TEstimatePointsObject, TEstimateSystemKeys, TEstimateTypeError } from "@plane/types";
import { Button, Sortable } from "@plane/ui";
// components
import { EstimatePointCreate, EstimatePointItemPreview } from "@/components/estimates/points";
// plane web constants
import { estimateCount } from "@/plane-web/constants/estimates";

type TEstimatePointCreateRoot = {
  workspaceSlug: string;
  projectId: string;
  estimateId: string | undefined;
  estimateType: TEstimateSystemKeys;
  estimatePoints: TEstimatePointsObject[];
  setEstimatePoints: Dispatch<SetStateAction<TEstimatePointsObject[] | undefined>>;
  estimatePointError?: TEstimateTypeError;
  handleEstimatePointError?: (
    key: number,
    oldValue: string,
    newValue: string,
    message: string | undefined,
    mode: "add" | "delete"
  ) => void;
};

export const EstimatePointCreateRoot: FC<TEstimatePointCreateRoot> = observer((props) => {
  // props
  const {
    workspaceSlug,
    projectId,
    estimateId,
    estimateType,
    estimatePoints,
    setEstimatePoints,
    estimatePointError,
    handleEstimatePointError,
  } = props;
  // states
  const [estimatePointCreate, setEstimatePointCreate] = useState<TEstimatePointsObject[] | undefined>(undefined);

  const handleEstimatePoint = useCallback(
    (mode: "add" | "remove" | "update", value: TEstimatePointsObject) => {
      switch (mode) {
        case "add":
          setEstimatePoints((prevValue) => {
            prevValue = prevValue ? [...prevValue] : [];
            return [...prevValue, value];
          });
          break;
        case "update":
          setEstimatePoints((prevValue) => {
            prevValue = prevValue ? [...prevValue] : [];
            return prevValue.map((item) => (item.key === value.key ? { ...item, value: value.value } : item));
          });
          break;
        case "remove":
          setEstimatePoints((prevValue) => {
            prevValue = prevValue ? [...prevValue] : [];
            return prevValue.filter((item) => item.key !== value.key);
          });
          break;
        default:
          break;
      }
    },
    [setEstimatePoints]
  );

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

  const handleDragEstimatePoints = (updatedEstimatedOrder: TEstimatePointsObject[]) => {
    const updatedEstimateKeysOrder = updatedEstimatedOrder.map((item, index) => ({ ...item, key: index + 1 }));
    setEstimatePoints(() => updatedEstimateKeysOrder);
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

  if (!workspaceSlug || !projectId) return <></>;
  return (
    <div className="space-y-1">
      <div className="text-sm font-medium text-custom-text-200 capitalize">{estimateType}</div>

      <div>
        <Sortable
          data={estimatePoints}
          render={(value: TEstimatePointsObject) => (
            <EstimatePointItemPreview
              workspaceSlug={workspaceSlug}
              projectId={projectId}
              estimateId={estimateId}
              estimateType={estimateType}
              estimatePointId={value?.id}
              estimatePoints={estimatePoints}
              estimatePoint={value}
              handleEstimatePointValueUpdate={(estimatePointValue: string) =>
                handleEstimatePoint("update", { ...value, value: estimatePointValue })
              }
              handleEstimatePointValueRemove={() => handleEstimatePoint("remove", value)}
              estimatePointError={estimatePointError?.[value.key] || undefined}
              handleEstimatePointError={(
                newValue: string,
                message: string | undefined,
                mode: "add" | "delete" = "add"
              ) =>
                handleEstimatePointError && handleEstimatePointError(value.key, value.value, newValue, message, mode)
              }
            />
          )}
          onChange={(data: TEstimatePointsObject[]) => handleDragEstimatePoints(data)}
          keyExtractor={(item: TEstimatePointsObject) => item?.id?.toString() || item.value.toString()}
        />
      </div>

      {estimatePointCreate &&
        estimatePointCreate.map((estimatePoint) => (
          <EstimatePointCreate
            key={estimatePoint?.key}
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            estimateId={estimateId}
            estimateType={estimateType}
            estimatePoints={estimatePoints}
            handleEstimatePointValue={(estimatePointValue: string) =>
              handleEstimatePoint("add", { ...estimatePoint, value: estimatePointValue })
            }
            closeCallBack={() => handleEstimatePointCreate("remove", estimatePoint)}
            handleCreateCallback={() => estimatePointCreate.length === 1 && handleCreate()}
            estimatePointError={estimatePointError?.[estimatePoint.key] || undefined}
            handleEstimatePointError={(newValue: string, message: string | undefined, mode: "add" | "delete" = "add") =>
              handleEstimatePointError &&
              handleEstimatePointError(estimatePoint.key, estimatePoint.value, newValue, message, mode)
            }
          />
        ))}
      {estimatePoints && estimatePoints.length + (estimatePointCreate?.length || 0) <= estimateCount.max - 1 && (
        <Button variant="link-primary" size="sm" prependIcon={<Plus />} onClick={handleCreate}>
          Add {estimateType}
        </Button>
      )}
    </div>
  );
});
