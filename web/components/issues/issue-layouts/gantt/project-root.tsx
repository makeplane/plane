import React from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// components
import { BaseGanttRoot } from "./base-gantt-root";
import { EIssuesStoreType } from "constants/issue";

export const GanttLayout: React.FC = observer(() => {
  // router
  const router = useRouter();

  return <BaseGanttRoot storeType={EIssuesStoreType.PROJECT} />;
});
