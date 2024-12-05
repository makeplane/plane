"use client";

import { observer } from "mobx-react";
import useSWR from "swr";
// components
import { LogoSpinner, PoweredBy } from "@/components/common";
import { SomethingWentWrongError } from "@/components/issues/issue-layouts/error";
// hooks
import { usePublish, usePublishList } from "@/hooks/store";
// Plane web
import { ViewNavbarRoot } from "@/plane-web/components/navbar";
import { useView } from "@/plane-web/hooks/store";

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
  const { viewData, fetchViewDetails } = useView();
  const publishSettings = usePublish(anchor);

  // fetch publish settings && view details
  const { error } = useSWR(
    anchor ? `PUBLISHED_VIEW_SETTINGS_${anchor}` : null,
    anchor
      ? async () => {
          const promises = [];
          promises.push(fetchPublishSettings(anchor));
          promises.push(fetchViewDetails(anchor));
          await Promise.all(promises);
        }
      : null
  );

  if (error) return <SomethingWentWrongError />;

  if (!publishSettings || !viewData) return <LogoSpinner />;

  return (
    <div className="relative flex h-screen min-h-[500px] w-screen flex-col overflow-hidden">
      <div className="relative flex h-[60px] flex-shrink-0 select-none items-center border-b border-custom-border-300 bg-custom-sidebar-background-100">
        <ViewNavbarRoot publishSettings={publishSettings} />
      </div>
      <div className="relative h-full w-full overflow-hidden bg-custom-background-90">{children}</div>
      <PoweredBy />
    </div>
  );
});

export default IssuesLayout;
