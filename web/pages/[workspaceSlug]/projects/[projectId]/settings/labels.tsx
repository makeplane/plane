import { ReactElement, useEffect, useRef } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { autoScrollForElements } from "@atlaskit/pragmatic-drag-and-drop-auto-scroll/element";
import { observer } from "mobx-react";
// layouts
import { PageHead } from "@/components/core";
import { ProjectSettingHeader } from "@/components/headers";
import { ProjectSettingsLabelList } from "@/components/labels";
import { useProject } from "@/hooks/store";
import { AppLayout } from "@/layouts/app-layout";
import { ProjectSettingLayout } from "@/layouts/settings-layout";
// components
// types
import { NextPageWithLayout } from "@/lib/types";
// hooks

const LabelsSettingsPage: NextPageWithLayout = observer(() => {
  const { currentProjectDetails } = useProject();
  const pageTitle = currentProjectDetails?.name ? `${currentProjectDetails?.name} - Labels` : undefined;

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

  return (
    <>
      <PageHead title={pageTitle} />
      <div ref={scrollableContainerRef} className="h-full w-full gap-10 overflow-y-auto py-8 pr-9">
        <ProjectSettingsLabelList />
      </div>
    </>
  );
});

LabelsSettingsPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout withProjectWrapper header={<ProjectSettingHeader />}>
      <ProjectSettingLayout>{page}</ProjectSettingLayout>
    </AppLayout>
  );
};

export default LabelsSettingsPage;
