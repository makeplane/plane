"use client";
import { ReactNode } from "react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// plane web hooks
import { EPageStoreType, usePageStore } from "@/plane-web/hooks/store";

export default function TeamspacePagesLayout({ children }: { children: ReactNode }) {
  const { workspaceSlug, teamspaceId } = useParams();
  // store hooks
  const { fetchPagesList } = usePageStore(EPageStoreType.TEAMSPACE);
  // fetch teamspace pages
  useSWR(
    workspaceSlug && teamspaceId ? ["teamspacePages", workspaceSlug, teamspaceId] : null,
    () => (workspaceSlug && teamspaceId ? fetchPagesList(workspaceSlug.toString(), teamspaceId.toString()) : null),
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
    }
  );
  return <>{children}</>;
}
