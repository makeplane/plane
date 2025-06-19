"use client";

import { EPageStoreType } from "@/ce/hooks/store";
// store
import { TPageInstance } from "@/store/pages/base-page";

export type TPageShareControlProps = {
  page: TPageInstance;
  storeType: EPageStoreType;
};

export const PageShareControl = ({}: TPageShareControlProps) => null;
