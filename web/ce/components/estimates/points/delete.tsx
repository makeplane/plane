"use client";

import { FC } from "react";

import { TEstimatePointsObject, TEstimateSystemKeys, TEstimateTypeErrorObject } from "@plane/types";

export type TEstimatePointDelete = {
  workspaceSlug: string;
  projectId: string;
  estimateId: string;
  estimatePointId: string;
  estimatePoints: TEstimatePointsObject[];
  callback: () => void;
  estimatePointError?: TEstimateTypeErrorObject | undefined;
  handleEstimatePointError?: (newValue: string, message: string | undefined, mode?: "add" | "delete") => void;
  estimateSystem: TEstimateSystemKeys;
};

export const EstimatePointDelete: FC<TEstimatePointDelete> = () => <></>;
