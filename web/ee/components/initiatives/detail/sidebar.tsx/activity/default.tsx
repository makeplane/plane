"use client";

import { FC } from "react";
import { observer } from "mobx-react";
// hooks
import { LayersIcon } from "@plane/ui";
// Plane-web
import { TInitiativeActivity } from "@/plane-web/types/initiative";
//
import { InitiativeActivityBlockComponent } from "./common";

type TInitiativeDefaultActivity = { activity: TInitiativeActivity; ends: "top" | "bottom" | undefined };

export const InitiativeDefaultActivity: FC<TInitiativeDefaultActivity> = observer((props) => {
  const { activity, ends } = props;

  if (!activity) return <></>;
  return (
    <InitiativeActivityBlockComponent
      activity={activity}
      icon={<LayersIcon width={14} height={14} className="text-custom-text-200" aria-hidden="true" />}
      ends={ends}
    >
      <>{activity.verb === "created" ? " created the issue." : " deleted an issue."}</>
    </InitiativeActivityBlockComponent>
  );
});
