"use client";

import { useSearchParams } from "next/navigation";
import useSWR from "swr";
// components
import { ProjectDetailsView } from "@/components/views";
// hooks
import { usePublish, usePublishList } from "@/hooks/store";

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
  // store hooks
  const { fetchPublishSettings } = usePublishList();
  const publishSettings = usePublish(anchor);

  useSWR(anchor ? `PUBLISH_SETTINGS_${anchor}` : null, anchor ? () => fetchPublishSettings(anchor) : null);

  if (!publishSettings) return null;

  return <ProjectDetailsView peekId={peekId} publishSettings={publishSettings} />;
};

export default ProjectIssuesPage;
