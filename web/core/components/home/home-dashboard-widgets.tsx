import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// types
import { TWidgetKeys, WidgetProps } from "@plane/types";
// components
import { RecentActivityWidget, EmptyWorkspace } from "@/components/dashboard";
// hooks
import { useDashboard, useProject } from "@/hooks/store";
import { useHome } from "@/hooks/store/use-home";
import { HomePageHeader } from "@/plane-web/components/home/header";
import { DashboardQuickLinks } from "./links";
import { ManageWidgetsModal } from "./widgets/manage";

const WIDGETS_LIST: {
  [key in TWidgetKeys]: { component: React.FC<WidgetProps>; fullWidth: boolean };
} = {
  recent_activity: { component: RecentActivityWidget, fullWidth: false },
  // recent_collaborators: { component: RecentCollaboratorsWidget, fullWidth: true },
  // my_stickies: { component: StickiesWidget, fullWidth: false },
};

export const DashboardWidgets = observer(() => {
  // router
  const { workspaceSlug } = useParams();
  const { totalProjectIds } = useProject();
  // store hooks
  const { toggleWidgetSettings, showWidgetSettings } = useHome();
  const { homeDashboardId, homeDashboardWidgets } = useDashboard();

  const doesWidgetExist = (widgetKey: TWidgetKeys) =>
    Boolean(homeDashboardWidgets?.find((widget) => widget.key === widgetKey));

  if (!workspaceSlug || !homeDashboardId) return null;

  return (
    <div className="relative flex flex-col gap-7">
      <HomePageHeader />
      <ManageWidgetsModal
        workspaceSlug={workspaceSlug.toString()}
        isModalOpen={showWidgetSettings}
        handleOnClose={() => toggleWidgetSettings(false)}
      />
      <DashboardQuickLinks workspaceSlug={workspaceSlug.toString()} />

      {totalProjectIds?.length === 0 ? (
        <EmptyWorkspace />
      ) : (
        Object.entries(WIDGETS_LIST).map(([key, widget]) => {
          const WidgetComponent = widget.component;
          // if the widget doesn't exist, return null
          // if (!doesWidgetExist(key as TWidgetKeys)) return null;
          // if the widget is full width, return it in a 2 column grid
          console.log({ widget, key });
          if (widget.fullWidth)
            return (
              <div key={key} className="lg:col-span-2">
                <WidgetComponent dashboardId={homeDashboardId} workspaceSlug={workspaceSlug.toString()} />
              </div>
            );
          else
            return <WidgetComponent key={key} dashboardId={homeDashboardId} workspaceSlug={workspaceSlug.toString()} />;
        })
      )}
    </div>
  );
});
