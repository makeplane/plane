"use client";

import useSWR from "swr";
// hooks
import { usePublish, usePublishList } from "@/hooks/store";

type Props = {
  params: {
    anchor: string;
  };
};

const PageDetailsPage = (props: Props) => {
  const { params } = props;
  const { anchor } = params;
  // store hooks
  const { fetchPublishSettings } = usePublishList();
  const publishSettings = usePublish(anchor);

  useSWR(anchor ? `PUBLISH_SETTINGS_${anchor}` : null, anchor ? () => fetchPublishSettings(anchor) : null);

  if (!publishSettings) return null;

  return <>Page details</>;
};

export default PageDetailsPage;
