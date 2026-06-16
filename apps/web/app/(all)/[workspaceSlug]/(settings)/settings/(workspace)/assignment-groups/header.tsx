import { observer } from "mobx-react";
// plane imports
import { WORKSPACE_SETTINGS } from "@plane/constants";
import { Breadcrumbs } from "@plane/ui";
// components
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
import { SettingsPageHeader } from "@/components/settings/page-header";
import { WORKSPACE_SETTINGS_ICONS } from "@/components/settings/workspace/sidebar/item-icon";

export const AssignmentGroupsWorkspaceSettingsHeader = observer(function AssignmentGroupsWorkspaceSettingsHeader() {
  // derived values
  const settingsDetails = WORKSPACE_SETTINGS["assignment-groups"];
  const Icon = WORKSPACE_SETTINGS_ICONS["assignment-groups"];

  return (
    <SettingsPageHeader
      leftItem={
        <div className="flex items-center gap-2">
          <Breadcrumbs>
            <Breadcrumbs.Item
              component={
                <BreadcrumbLink
                  label={settingsDetails.i18n_label}
                  icon={<Icon className="size-4 text-tertiary" />}
                />
              }
            />
          </Breadcrumbs>
        </div>
      }
    />
  );
});
