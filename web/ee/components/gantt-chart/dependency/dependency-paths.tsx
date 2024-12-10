import { useState } from "react";
import { observer } from "mobx-react";
// hooks
import { useTimeLineChartStore } from "@/hooks/use-timeline-chart";
// Plane-web
import { Relation } from "@/plane-web/types";
//
import { DependencyPathModal } from "./dependency-modal";
import { TimelineDependencyPathItem } from "./dependency-path-item";

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
