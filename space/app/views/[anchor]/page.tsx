"use client";

import { observer } from "mobx-react";
import { useSearchParams } from "next/navigation";
// components
import { PoweredBy } from "@/components/common";
// hooks
import { usePublish } from "@/hooks/store";
// plane-web
import { ViewLayoutsRoot } from "@/plane-web/components/issue-layouts/root";

type Props = {
  params: {
    anchor: string;
  };
};

const IssuesPage = observer((props: Props) => {
  const { params } = props;
  const { anchor } = params;
  // params
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

export default IssuesPage;
