"use client";

import React from "react";
import { observer } from "mobx-react";
// components
import { EPageStoreType } from "@/plane-web/hooks/store";
// store
import { TPageInstance } from "@/store/pages/base-page";

export type TPageModalsProps = {
  page: TPageInstance;
  storeType: EPageStoreType;
};

export const PageModals: React.FC<TPageModalsProps> = observer((props) => null);
