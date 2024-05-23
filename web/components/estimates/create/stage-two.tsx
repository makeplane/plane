import { FC } from "react";
import { Plus } from "lucide-react";
import { Button } from "@plane/ui";
// components
import { EstimateItem } from "@/components/estimates";
import {
  EEstimateSystem,
  TEstimatePointNumeric,
  TEstimatePointString,
  TEstimateSystemKeyObject,
  TEstimateSystemKeys,
} from "@/components/estimates/types";
import { Sortable } from "@/components/sortable/sortable";
// constants
import { ESTIMATE_SYSTEMS } from "@/constants/estimates";

type TEstimateCreateStageTwo = {
  estimateSystem: EEstimateSystem;
  estimatePoints: TEstimateSystemKeyObject[TEstimateSystemKeys];
  handleEstimatePoints: (value: TEstimateSystemKeyObject[TEstimateSystemKeys]) => void;
};

export const EstimateCreateStageTwo: FC<TEstimateCreateStageTwo> = (props) => {
  const { estimateSystem, estimatePoints, handleEstimatePoints } = props;

  const currentEstimateSystem = ESTIMATE_SYSTEMS[estimateSystem] || undefined;

  const addNewEstimationPoint = () => {
    const currentEstimationPoints = estimatePoints;
    if ([EEstimateSystem.POINTS, EEstimateSystem.TIME].includes(estimateSystem)) {
      const newEstimationPoint: TEstimatePointNumeric = {
        key: currentEstimationPoints.length + 1,
        value: 0,
      };
      handleEstimatePoints([...currentEstimationPoints, newEstimationPoint] as TEstimatePointNumeric[]);
    }
    if (estimateSystem === EEstimateSystem.CATEGORIES) {
      const newEstimationPoint: TEstimatePointString = {
        key: currentEstimationPoints.length + 1,
        value: "",
      };
      handleEstimatePoints([...currentEstimationPoints, newEstimationPoint] as TEstimatePointString[]);
    }
  };

  const deleteEstimationPoint = (index: number) => {
    const newEstimationPoints = estimatePoints;
    newEstimationPoints.splice(index, 1);
    handleEstimatePoints(newEstimationPoints);
  };

  const updatedSortedKeys = (updatedEstimatePoints: TEstimateSystemKeyObject[TEstimateSystemKeys]) =>
    updatedEstimatePoints.map((item, index) => ({
      ...item,
      key: index + 1,
    })) as TEstimateSystemKeyObject[TEstimateSystemKeys];

  return (
    <div className="space-y-4">
      <Sortable
        data={estimatePoints as any}
        render={(value: TEstimatePointString | TEstimatePointNumeric, index: number) => (
          <EstimateItem item={value} deleteItem={() => deleteEstimationPoint(index)} />
        )}
        onChange={(data: TEstimateSystemKeyObject[TEstimateSystemKeys]) => {
          console.log("updatedSortedKeys(data)", updatedSortedKeys(data));
          handleEstimatePoints(updatedSortedKeys(data));
        }}
        keyExtractor={(item: TEstimatePointString | TEstimatePointNumeric, index: number) =>
          item?.id?.toString() || item.value.toString()
        }
      />

      <Button prependIcon={<Plus />} onClick={addNewEstimationPoint}>
        Add {currentEstimateSystem?.name}
      </Button>
    </div>
  );
};
