"use client";

import { observer } from "mobx-react-lite";
import useSWR from "swr";
// components
import { LogoSpinner } from "@/components/common";
// hooks
import { usePublish, usePublishList } from "@/hooks/store";
// plane web components
import { PageDetailsError, PageDetailsHeader } from "@/plane-web/components/pages";

type Props = {
  children: React.ReactNode;
  params: {
    anchor: string;
  };
};

const IssuesLayout = observer((props: Props) => {
  const { children, params } = props;
  // params
  const { anchor } = params;
  // store hooks
  const { fetchPublishSettings } = usePublishList();
  const { entity_identifier } = usePublish(anchor);
  // fetch publish settings
  const { error } = useSWR(
    anchor ? `PUBLISH_SETTINGS_${anchor}` : null,
    anchor ? () => fetchPublishSettings(anchor) : null
  );

  if (!entity_identifier && !error) return <LogoSpinner />;

  if (error) return <PageDetailsError />;

  return (
    <div className="size-full flex flex-col">
      <PageDetailsHeader anchor={anchor} />
      {children}
    </div>
  );
});

export default IssuesLayout;
