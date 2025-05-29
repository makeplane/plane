"use client";

import { useEffect, useRef } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { autoScrollForElements } from "@atlaskit/pragmatic-drag-and-drop-auto-scroll/element";
import { observer } from "mobx-react";
// components
import { NotAuthorizedView } from "@/components/auth-screens";
import { PageHead } from "@/components/core";
import { SettingsLabelList } from "@/components/labels";
// hooks
import { useUserPermissions, useWorkspace } from "@/hooks/store";

const LabelsSettingsPage = observer(() => {
  // store hooks
  const { workspaceUserInfo, allowPermissions } = useUserPermissions();
  const { currentWorkspace } = useWorkspace();

  const pageTitle = currentWorkspace?.name ? `${currentWorkspace?.name} - Labels` : undefined;

  const scrollableContainerRef = useRef<HTMLDivElement | null>(null);

  // Enable Auto Scroll for Labels list
  useEffect(() => {
    const element = scrollableContainerRef.current;

    if (!element) return;

    return combine(
      autoScrollForElements({
        element,
      })
    );
  }, [scrollableContainerRef?.current]);

  if (!workspaceUserInfo) {
    return <NotAuthorizedView section="settings" isProjectView />;
  }

  return (
    <>
      <PageHead title={pageTitle} />
      <SettingsLabelList />
    </>
  );
});

export default LabelsSettingsPage;
