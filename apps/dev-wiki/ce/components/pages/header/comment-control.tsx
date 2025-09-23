"use client";

import { EPageStoreType } from "@/ce/hooks/store";
// store
import { TPageInstance } from "@/store/pages/base-page";

export type TPageCommentControlProps = {
  page: TPageInstance;
  storeType: EPageStoreType;
};

export const PageCommentControl = ({}: TPageCommentControlProps) => null;
