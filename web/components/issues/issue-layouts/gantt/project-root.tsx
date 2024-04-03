import React from "react";
import { observer } from "mobx-react";
// hooks
import { EIssuesStoreType } from "@/constants/issue";
// components
import { BaseGanttRoot } from "./base-gantt-root";

export const GanttLayout: React.FC = observer(() => <BaseGanttRoot storeType={EIssuesStoreType.PROJECT} />);
