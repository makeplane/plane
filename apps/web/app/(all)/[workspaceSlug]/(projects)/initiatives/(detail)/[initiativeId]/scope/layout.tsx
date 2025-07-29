"use client";

import { ReactNode } from "react";
// layouts
import { EInitiativeNavigationItem } from "@plane/types";
import { AppHeader, ContentWrapper } from "@/components/core";
import { InitiativesDetailsHeader } from "@/plane-web/components/initiatives/header/root";

const InitiativeScopeLayout = ({ children }: { children: ReactNode }) => (
  <>
    <AppHeader header={<InitiativesDetailsHeader selectedNavigationKey={EInitiativeNavigationItem.SCOPE} />} />
    <ContentWrapper className="overflow-hidden">{children}</ContentWrapper>
  </>
);
export default InitiativeScopeLayout;
