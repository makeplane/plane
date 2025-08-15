"use client";

import { observer } from "mobx-react";
import useSWR from "swr";
// components
import { LogoSpinner } from "@/components/common/logo-spinner";
import { SomethingWentWrongError } from "@/components/issues/issue-layouts/error";
// hooks
import { PageNotFound } from "@/components/ui/not-found";
import { usePublish, usePublishList } from "@/hooks/store/publish";
// Plane web
import { ViewNavbarRoot } from "@/plane-web/components/navbar";
import { useView } from "@/plane-web/hooks/store";

type Props = {
  children: React.ReactNode;
  anchor: string;
};

export const ViewsClientLayout = observer((props: Props) => {
  const { children, anchor } = props;
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
  if (error?.status === 404) return <PageNotFound />;

  if (error) return <SomethingWentWrongError />;

  if (!publishSettings || !viewData)
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <LogoSpinner />
      </div>
    );

  return (
    <div className="relative flex h-screen min-h-[500px] w-screen flex-col overflow-hidden">
      <div className="relative flex h-[60px] flex-shrink-0 select-none items-center border-b border-custom-border-300 bg-custom-sidebar-background-100">
        <ViewNavbarRoot publishSettings={publishSettings} />
      </div>
      <div className="relative h-full w-full overflow-hidden bg-custom-background-90">{children}</div>
    </div>
  );
});

export default ViewsClientLayout;
