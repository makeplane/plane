import { ExternalLink, Link } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { EditIcon , TrashIcon } from "@plane/propel/icons";
import type { EIssueLayoutTypes, IProjectView } from "@plane/types";
import type { TContextMenuItem } from "@plane/ui";
import type { TWorkspaceLayoutProps } from "@/components/views/helper";

export type TLayoutSelectionProps = {
  onChange: (layout: EIssueLayoutTypes) => void;
  selectedLayout: EIssueLayoutTypes;
  workspaceSlug: string;
};

export function GlobalViewLayoutSelection(props: TLayoutSelectionProps) {
  return <></>;
}

export function WorkspaceAdditionalLayouts(props: TWorkspaceLayoutProps) {
  return <></>;
}

export type TMenuItemsFactoryProps = {
  isOwner: boolean;
  isAdmin: boolean;
  setDeleteViewModal: (open: boolean) => void;
  setCreateUpdateViewModal: (open: boolean) => void;
  handleOpenInNewTab: () => void;
  handleCopyText: () => void;
  isLocked: boolean;
  workspaceSlug: string;
  projectId?: string;
  viewId: string;
};

export const useMenuItemsFactory = (props: TMenuItemsFactoryProps) => {
  const { isOwner, isAdmin, setDeleteViewModal, setCreateUpdateViewModal, handleOpenInNewTab, handleCopyText } = props;

  const { t } = useTranslation();

  const editMenuItem = () => ({
    key: "edit",
    action: () => setCreateUpdateViewModal(true),
    title: t("edit"),
    icon: EditIcon,
    shouldRender: isOwner,
  });

  const openInNewTabMenuItem = () => ({
    key: "open-new-tab",
    action: handleOpenInNewTab,
    title: t("open_in_new_tab"),
    icon: ExternalLink,
  });

  const copyLinkMenuItem = () => ({
    key: "copy-link",
    action: handleCopyText,
    title: t("copy_link"),
    icon: Link,
  });

  const deleteMenuItem = () => ({
    key: "delete",
    action: () => setDeleteViewModal(true),
    title: t("delete"),
    icon: TrashIcon,
    shouldRender: isOwner || isAdmin,
  });

  return {
    editMenuItem,
    openInNewTabMenuItem,
    copyLinkMenuItem,
    deleteMenuItem,
  };
};

export const useViewMenuItems = (props: TMenuItemsFactoryProps): TContextMenuItem[] => {
  const factory = useMenuItemsFactory(props);

  return [factory.editMenuItem(), factory.openInNewTabMenuItem(), factory.copyLinkMenuItem(), factory.deleteMenuItem()];
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function AdditionalHeaderItems(view: IProjectView) {
  return <></>;
}
