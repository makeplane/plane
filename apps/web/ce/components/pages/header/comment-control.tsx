"use client";

// store
import { type EPageStoreType } from "@/plane-web/hooks/store";
import { TPageInstance } from "@/store/pages/base-page";

export type TPageCommentControlProps = {
  page: TPageInstance;
  storeType: EPageStoreType;
};

export const PageCommentControl = ({}: TPageCommentControlProps) => null;
