"use client";

import { observer } from "mobx-react";
import useSWR from "swr";
// components
import { LogoSpinner, PoweredBy } from "@/components/common";
import { IssuesNavbarRoot } from "@/components/issues";
import { SomethingWentWrongError } from "@/components/issues/issue-layouts/error";
// hooks
import { useIssueFilter, usePublish, usePublishList } from "@/hooks/store";

type Props = {
  children: React.ReactNode;
  anchor: string;
};

export const IssuesClientLayout = observer((props: Props) => {
  const { children, anchor } = props;
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
    <>
      <div className="relative flex h-screen min-h-[500px] w-screen flex-col overflow-hidden">
        <div className="relative flex h-[60px] flex-shrink-0 select-none items-center border-b border-custom-border-300 bg-custom-sidebar-background-100">
          <IssuesNavbarRoot publishSettings={publishSettings} />
        </div>
        <div className="relative h-full w-full overflow-hidden bg-custom-background-90">{children}</div>
      </div>
      <PoweredBy />
    </>
  );
});
