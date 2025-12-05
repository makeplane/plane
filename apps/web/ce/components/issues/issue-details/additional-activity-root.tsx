import type { FC } from "react";
import { observer } from "mobx-react";

export type TAdditionalActivityRoot = {
  activityId: string;
  showIssue?: boolean;
  ends: "top" | "bottom" | undefined;
  field: string | undefined;
};

export const AdditionalActivityRoot = observer(function AdditionalActivityRoot(_props: TAdditionalActivityRoot) {
  return <></>;
});
