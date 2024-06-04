"use client";

import { useSearchParams } from "next/navigation";
// components
import { ProjectDetailsView } from "@/components/views";
// hooks
import { usePublish } from "@/hooks/store";

type Props = {
  params: {
    anchor: string;
  };
};

const ProjectIssuesPage = (props: Props) => {
  const { params } = props;
  const { anchor } = params;
  // params
  const searchParams = useSearchParams();
  const peekId = searchParams.get("peekId") || undefined;

  const publishSettings = usePublish(anchor);

  if (!publishSettings) return null;

  return <ProjectDetailsView peekId={peekId} publishSettings={publishSettings} />;
};

export default ProjectIssuesPage;
