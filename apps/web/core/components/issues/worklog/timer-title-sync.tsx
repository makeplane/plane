/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

"use client";

import { useEffect } from "react";
import { observer } from "mobx-react";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { formatElapsed } from "./utils";

type TTimerTitleSync = {
  workspaceSlug: string;
};

// matches a "⏱ <elapsed> · " prefix we prepend to document.title
const TITLE_PREFIX_RE = /^⏱\s[^·]*·\s/;

// While a timer is running, prepend the elapsed time to the browser tab title so it's visible
// from any page. Mounted once at the workspace layout level.
export const TimerTitleSync = observer(function TimerTitleSync(props: TTimerTitleSync) {
  const { workspaceSlug } = props;
  const { worklog } = useIssueDetail();

  // make sure we know about a running timer even right after a page load
  useEffect(() => {
    if (workspaceSlug) worklog.fetchUserActiveTimer(workspaceSlug);
  }, [workspaceSlug, worklog]);

  const activeTimer = worklog.userActiveTimer;
  const startedAt = activeTimer?.duration === null ? activeTimer?.started_at : null;

  useEffect(() => {
    if (!startedAt) return;
    const update = () => {
      // strip any previous prefix (route changes reset document.title) then re-apply
      const base = document.title.replace(TITLE_PREFIX_RE, "");
      document.title = `⏱ ${formatElapsed(startedAt)} · ${base}`;
    };
    update();
    const id = window.setInterval(update, 1000);
    return () => {
      window.clearInterval(id);
      document.title = document.title.replace(TITLE_PREFIX_RE, "");
    };
  }, [startedAt]);

  return null;
});
