import { observer } from "mobx-react";
// local imports
import { NotificationFilter } from "../../filters/menu";
import { NotificationHeaderMenuOption } from "./menu-option";

type TNotificationSidebarHeaderOptions = {
  workspaceSlug: string;
};

export const NotificationSidebarHeaderOptions = observer(function NotificationSidebarHeaderOptions(
  props: TNotificationSidebarHeaderOptions
) {
  return (
    <div className="relative flex justify-center items-center gap-2 text-body-xs-medium">
      {/* notification filters */}
      <NotificationFilter />

      {/* notification menu options */}
      <NotificationHeaderMenuOption />
    </div>
  );
});
