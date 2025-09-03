"use client";

import { observer } from "mobx-react";

export type TIssueTypeActivity = { activityId: string; showIssue?: boolean; ends: "top" | "bottom" | undefined };

export const IssueTypeActivity: React.FC<TIssueTypeActivity> = observer(() => <></>);
