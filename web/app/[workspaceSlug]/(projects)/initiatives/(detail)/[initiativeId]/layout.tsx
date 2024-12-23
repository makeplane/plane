"use client";

import { ReactNode } from "react";
// layouts
import { AppHeader, ContentWrapper } from "@/components/core";
import { InitiativesDetailsHeader } from "./header";

const ProjectDetailLayout = ({ children }: { children: ReactNode }) => (
  <>
    <AppHeader header={<InitiativesDetailsHeader />} />
    <ContentWrapper>{children}</ContentWrapper>
  </>
);

export default ProjectDetailLayout;
