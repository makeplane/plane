import { useMemo } from "react";
import { TContextMenuItem } from "@plane/ui";
import {
  MenuItemFactoryProps,
  useMenuItemFactory,
} from "@/components/issues/issue-layouts/quick-action-dropdowns/helper";

export const useEpicMenuItems = (props: MenuItemFactoryProps): TContextMenuItem[] => {
  const factory = useMenuItemFactory(props);

  return useMemo(
    () => [
      factory.createEditMenuItem(),
      factory.createCopyMenuItem(props.workspaceSlug),
      factory.createOpenInNewTabMenuItem(),
      factory.createCopyLinkMenuItem(),
      factory.createDeleteMenuItem(),
    ],
    [factory, props.workspaceSlug]
  );
};
