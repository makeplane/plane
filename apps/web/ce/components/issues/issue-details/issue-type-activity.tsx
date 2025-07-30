"use client";

import { FC } from "react";
import { observer } from "mobx-react";

export type TIssueTypeActivity = { activityId: string; showIssue?: boolean; ends: "top" | "bottom" | undefined };

export const IssueTypeActivity: FC<TIssueTypeActivity> = observer(() => <></>);
