import { useState } from "react";
import { observer } from "mobx-react";
// hooks
import { useTimeLineChartStore } from "@/hooks/use-timeline-chart";
// Plane-web
import { Relation } from "@/plane-web/types";
//
import { TimelineDependencyPathItem } from "./dependency-path-item";
import { DependencyPathModal } from "./dependency-modal";

export const TimelineDependencyPaths = observer(() => {
  const { isDependencyEnabled, relations } = useTimeLineChartStore();
  const [selectedRelation, setSelectedRelation] = useState<Relation | undefined>();

  if (!isDependencyEnabled) return <></>;

  const handleClose = () => {
    setSelectedRelation(undefined);
  };

  return (
    <>
      <DependencyPathModal relation={selectedRelation} handleClose={handleClose} />
      <div>
        {relations.map((relation) => (
          <TimelineDependencyPathItem
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
