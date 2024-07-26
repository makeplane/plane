"use client";

import { observer } from "mobx-react";
import Image from "next/image";
import useSWR from "swr";
// components
import { LogoSpinner } from "@/components/common";
import { IssuesNavbarRoot } from "@/components/issues";
import { SomethingWentWrongError } from "@/components/issues/issue-layouts/error";
// hooks
import { useIssueFilter, usePublish, usePublishList } from "@/hooks/store";
// assets
import planeLogo from "@/public/plane-logo.svg";

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
  const publishSettings = usePublish(anchor);
  const { updateLayoutOptions } = useIssueFilter();
  // fetch publish settings
  const { error } = useSWR(
    anchor ? `PUBLISH_SETTINGS_${anchor}` : null,
    anchor
      ? async () => {
          const response = await fetchPublishSettings(anchor);
          if (response.view_props) {
            updateLayoutOptions({
              list: !!response.view_props.list,
              kanban: !!response.view_props.kanban,
              calendar: !!response.view_props.calendar,
              gantt: !!response.view_props.gantt,
              spreadsheet: !!response.view_props.spreadsheet,
            });
          }
        }
      : null
  );

  if (!publishSettings && !error) return <LogoSpinner />;

  if (error) return <SomethingWentWrongError />;

  return (
    <div className="relative flex h-screen min-h-[500px] w-screen flex-col overflow-hidden">
      <div className="relative flex h-[60px] flex-shrink-0 select-none items-center border-b border-custom-border-300 bg-custom-sidebar-background-100">
        <IssuesNavbarRoot publishSettings={publishSettings} />
      </div>
      <div className="relative h-full w-full overflow-hidden bg-custom-background-90">{children}</div>
      <a
        href="https://plane.so"
        className="fixed bottom-2.5 right-5 !z-[999999] flex items-center gap-1 rounded border border-custom-border-200 bg-custom-background-100 px-2 py-1 shadow-custom-shadow-2xs"
        target="_blank"
        rel="noreferrer noopener"
      >
        <div className="relative grid h-6 w-6 place-items-center">
          <Image src={planeLogo} alt="Plane logo" className="h-6 w-6" height="24" width="24" />
        </div>
        <div className="text-xs">
          Powered by <span className="font-semibold">Plane Publish</span>
        </div>
      </a>
    </div>
  );
});

export default IssuesLayout;
