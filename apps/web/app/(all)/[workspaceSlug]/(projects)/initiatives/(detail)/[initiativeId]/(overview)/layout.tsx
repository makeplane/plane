"use client";

import { ReactNode } from "react";
// layouts
import { EInitiativeNavigationItem } from "@plane/types";
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
import { InitiativesDetailsHeader } from "@/plane-web/components/initiatives/header/root";

const ProjectDetailLayout = ({ children }: { children: ReactNode }) => (
  <>
    <AppHeader header={<InitiativesDetailsHeader selectedNavigationKey={EInitiativeNavigationItem.OVERVIEW} />} />
    <ContentWrapper className="overflow-hidden">{children}</ContentWrapper>
  </>
);

export default ProjectDetailLayout;
