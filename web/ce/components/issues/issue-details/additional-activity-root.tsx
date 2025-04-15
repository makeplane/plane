"use client";

import { FC } from "react";
import { observer } from "mobx-react";

export type TAdditionalActivityRoot = {
  activityId: string;
  showIssue?: boolean;
  ends: "top" | "bottom" | undefined;
  field: string | undefined;
};

export const AdditionalActivityRoot: FC<TAdditionalActivityRoot> = observer(() => <></>);
