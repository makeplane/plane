"use client";

import { observer } from "mobx-react";

export type TAdditionalActivityRoot = {
  activityId: string;
  showIssue?: boolean;
  ends: "top" | "bottom" | undefined;
  field: string | undefined;
};

export const AdditionalActivityRoot: React.FC<TAdditionalActivityRoot> = observer(() => <></>);
