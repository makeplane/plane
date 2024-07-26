"use client";

import { FC } from "react";

import { TEstimateTypeErrorObject } from "@plane/types";

type TEstimatePointDelete = {
  workspaceSlug: string;
  projectId: string;
  estimateId: string;
  estimatePointId: string;
  callback: () => void;
  estimatePointError?: TEstimateTypeErrorObject | undefined;
  handleEstimatePointError?: (newValue: string, message: string | undefined, mode?: "add" | "delete") => void;
};

export const EstimatePointDelete: FC<TEstimatePointDelete> = () => <></>;
