"use client";

import { ReactNode } from "react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// components
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
// local components
import { InitiativesListHeader } from "./header";

export default function InitiativesListLayout({ children }: { children: ReactNode }) {
  const { workspaceSlug } = useParams();
  const {
    initiativeFilters: { initInitiativeFilters },
  } = useInitiatives();

  useSWR(
    workspaceSlug ? `initInitiativeFilters-${workspaceSlug}` : null,
    workspaceSlug ? () => initInitiativeFilters(workspaceSlug.toString()) : null
  );

  return (
    <>
      <AppHeader header={<InitiativesListHeader />} />
      <ContentWrapper>{children}</ContentWrapper>
    </>
  );
}
