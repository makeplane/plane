"use client";

import React, { FC } from "react";
import { observer } from "mobx-react";
import { TStateAnalytics } from "@plane/types";
// plane web
import { ProgressSection } from "@/plane-web/components/common/layout/main/sections/progress-root";
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";

type Props = {
  initiativeId: string;
};

export const InitiativeProgressSection: FC<Props> = observer((props) => {
  const { initiativeId } = props;
  // store hooks
  const {
    initiative: { getInitiativeById, getInitiativeAnalyticsById },
  } = useInitiatives();

  // derived values
  const initiative = getInitiativeById(initiativeId);
  const initiativeAnalytics = getInitiativeAnalyticsById(initiativeId);

  const projectsIds = initiative?.project_ids ?? [];

  const shouldRenderProgressSection = (projectsIds.length ?? 0) > 0;

  if (!shouldRenderProgressSection) return <></>;

  return <ProgressSection data={initiativeAnalytics as TStateAnalytics} />;
});
