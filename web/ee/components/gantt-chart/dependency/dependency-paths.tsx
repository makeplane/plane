import { FC, useState } from "react";
import { observer } from "mobx-react";
// hooks
import { useTimeLineChartStore } from "@/hooks/use-timeline-chart";
// Plane-web
import { Relation } from "@/plane-web/types";
//
import { DependencyPathModal } from "./dependency-modal";
import { TimelineDependencyPathItem } from "./dependency-path-item";

type Props = {
  isEpic?: boolean;
};

export const TimelineDependencyPaths: FC<Props> = observer((props) => {
  const { isEpic = false } = props;
  // state
  const [selectedRelation, setSelectedRelation] = useState<Relation | undefined>();
  // store hooks
  const { isDependencyEnabled, relations } = useTimeLineChartStore();

  if (!isDependencyEnabled) return <></>;

  const handleClose = () => {
    setSelectedRelation(undefined);
  };

  return (
    <>
      <DependencyPathModal relation={selectedRelation} handleClose={handleClose} isEpic={isEpic} />
      <div>
        {relations.map((relation) => (
          <TimelineDependencyPathItem
            key={relation.id}
            relation={relation}
            onPathClick={(relation: Relation) => {
              setSelectedRelation(relation);
            }}
          />
        ))}
      </div>
    </>
  );
});
