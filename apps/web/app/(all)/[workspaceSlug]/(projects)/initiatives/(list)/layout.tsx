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

const InitiativesListLayout = ({ children }: { children: ReactNode }) => {
  const { workspaceSlug } = useParams();

  const {
    initiative: { initInitiatives },
  } = useInitiatives();

  useSWR(
    workspaceSlug ? `initInitiatives-${workspaceSlug}` : null,
    workspaceSlug ? () => initInitiatives(workspaceSlug.toString()) : null,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  return (
    <>
      <AppHeader header={<InitiativesListHeader />} />
      <ContentWrapper>{children}</ContentWrapper>
    </>
  );
};

export default InitiativesListLayout;
