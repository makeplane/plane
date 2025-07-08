"use client";

import { useEffect, FC } from "react";
import { observer } from "mobx-react";
// components
import { NavbarTheme, UserAvatar } from "@/components/issues";
// hooks
import useIsInIframe from "@/hooks/use-is-in-iframe";
// plane-web
import { useViewIssuesFilter } from "@/plane-web/hooks/store/use-view-issues-filter";
// store
import { PublishStore } from "@/store/publish/publish.store";
import { ViewIssueFilters } from "../issue-layouts/filters/root";

export type NavbarControlsProps = {
  publishSettings: PublishStore;
};

export const ViewNavbarControls: FC<NavbarControlsProps> = observer((props) => {
  // props
  const { publishSettings } = props;
  // hooks
  const { initIssueFilters } = useViewIssuesFilter();
  // derived values
  const { anchor } = publishSettings;

  const isInIframe = useIsInIframe();

  useEffect(() => {
    if (anchor) initIssueFilters(anchor, {});
  }, [anchor, initIssueFilters]);

  if (!anchor) return null;

  return (
    <>
      {/* issue filters */}
      <div className="relative flex flex-shrink-0 items-center gap-1 transition-all delay-150 ease-in-out">
        <ViewIssueFilters anchor={anchor} />
      </div>

      {/* theming */}
      <div className="relative flex-shrink-0">
        <NavbarTheme />
      </div>

      {!isInIframe && <UserAvatar />}
    </>
  );
});
