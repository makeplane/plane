"use client";

import { observer } from "mobx-react";
import { useParams, useSearchParams } from "next/navigation";
// components
import { PoweredBy } from "@/components/common/powered-by";
// hooks
import { usePublish } from "@/hooks/store/publish";
// plane-web
import { ViewLayoutsRoot } from "@/plane-web/components/issue-layouts/root";

const ViewsPage = observer(() => {
  // params
  const params = useParams<{ anchor: string }>();
  const { anchor } = params;
  const searchParams = useSearchParams();
  const peekId = searchParams.get("peekId") || undefined;

  const publishSettings = usePublish(anchor);

  if (!publishSettings) return null;

  return (
    <>
      <ViewLayoutsRoot peekId={peekId} publishSettings={publishSettings} />
      <PoweredBy />
    </>
  );
});

export default ViewsPage;
