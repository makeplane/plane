"use client";

import { FC } from "react";
import { observer } from "mobx-react";

export type TIssuePageActivity = { activityId: string; showIssue?: boolean; ends: "top" | "bottom" | undefined };

export const IssuePageActivity: FC<TIssuePageActivity> = observer(() => <></>);
