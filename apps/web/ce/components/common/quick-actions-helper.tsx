import type { ICycle, IModule, IProjectView, IWorkspaceView } from "@plane/types";
import type { TContextMenuItem } from "@plane/ui";
import { useQuickActionsFactory } from "@/components/common/quick-actions-factory";

// Cycles
export interface UseCycleMenuItemsProps {
  cycleDetails: ICycle;
  isEditingAllowed: boolean;
  workspaceSlug: string;
  projectId: string;
  cycleId: string;
  handleEdit: () => void;
  handleArchive: () => void;
  handleRestore: () => void;
  handleDelete: () => void;
  handleCopyLink: () => void;
  handleOpenInNewTab: () => void;
}

export const useCycleMenuItems = (props: UseCycleMenuItemsProps): MenuResult => {
  const factory = useQuickActionsFactory();
  const { cycleDetails, isEditingAllowed, ...handlers } = props;

  const isArchived = !!cycleDetails?.archived_at;
  const isCompleted = cycleDetails?.status?.toLowerCase() === "completed";

  return {
    items: [
      factory.createEditMenuItem(handlers.handleEdit, isEditingAllowed && !isCompleted && !isArchived),
      factory.createOpenInNewTabMenuItem(handlers.handleOpenInNewTab),
      factory.createCopyLinkMenuItem(handlers.handleCopyLink),
      factory.createArchiveMenuItem(handlers.handleArchive, {
        shouldRender: isEditingAllowed && !isArchived,
        disabled: !isCompleted,
        description: isCompleted ? undefined : "Only completed cycles can be archived",
      }),
      factory.createRestoreMenuItem(handlers.handleRestore, isEditingAllowed && isArchived),
      factory.createDeleteMenuItem(handlers.handleDelete, isEditingAllowed && !isCompleted && !isArchived),
    ],
    modals: null,
  };
};

// Modules
export interface UseModuleMenuItemsProps {
  moduleDetails: IModule;
  isEditingAllowed: boolean;
  workspaceSlug: string;
  projectId: string;
  moduleId: string;
  handleEdit: () => void;
  handleArchive: () => void;
  handleRestore: () => void;
  handleDelete: () => void;
  handleCopyLink: () => void;
  handleOpenInNewTab: () => void;
}

export const useModuleMenuItems = (props: UseModuleMenuItemsProps): MenuResult => {
  const factory = useQuickActionsFactory();
  const { moduleDetails, isEditingAllowed, ...handlers } = props;

  const isArchived = !!moduleDetails?.archived_at;
  const moduleState = moduleDetails?.status?.toLocaleLowerCase();
  const isInArchivableGroup = !!moduleState && ["completed", "cancelled"].includes(moduleState);

  return {
    items: [
      factory.createEditMenuItem(handlers.handleEdit, isEditingAllowed && !isArchived),
      factory.createOpenInNewTabMenuItem(handlers.handleOpenInNewTab),
      factory.createCopyLinkMenuItem(handlers.handleCopyLink),
      factory.createArchiveMenuItem(handlers.handleArchive, {
        shouldRender: isEditingAllowed && !isArchived,
        disabled: !isInArchivableGroup,
        description: isInArchivableGroup ? undefined : "Only completed or cancelled modules can be archived",
      }),
      factory.createRestoreMenuItem(handlers.handleRestore, isEditingAllowed && isArchived),
      factory.createDeleteMenuItem(handlers.handleDelete, isEditingAllowed),
    ],
    modals: null,
  };
};

// Views
export interface UseViewMenuItemsProps {
  isOwner: boolean;
  isAdmin: boolean;
  workspaceSlug: string;
  projectId?: string;
  view: IProjectView | IWorkspaceView;
  handleEdit: () => void;
  handleDelete: () => void;
  handleCopyLink: () => void;
  handleOpenInNewTab: () => void;
}

export const useViewMenuItems = (props: UseViewMenuItemsProps): MenuResult => {
  const factory = useQuickActionsFactory();

  return {
    items: [
      factory.createEditMenuItem(props.handleEdit, props.isOwner),
      factory.createOpenInNewTabMenuItem(props.handleOpenInNewTab),
      factory.createCopyLinkMenuItem(props.handleCopyLink),
      factory.createDeleteMenuItem(props.handleDelete, props.isOwner || props.isAdmin),
    ],
    modals: null,
  };
};

export interface UseLayoutMenuItemsProps {
  workspaceSlug: string;
  projectId: string;
  storeType: "PROJECT" | "EPIC";
  handleCopyLink: () => void;
  handleOpenInNewTab: () => void;
}

export type MenuResult = {
  items: TContextMenuItem[];
  modals: JSX.Element | null;
};

export const useLayoutMenuItems = (props: UseLayoutMenuItemsProps): MenuResult => {
  const factory = useQuickActionsFactory();

  return {
    items: [
      factory.createOpenInNewTab(props.handleOpenInNewTab),
      factory.createCopyLayoutLinkMenuItem(props.handleCopyLink),
    ],
    modals: null,
  };
};

export const useIntakeHeaderMenuItems = (props: {
  workspaceSlug: string;
  projectId: string;
  handleCopyLink: () => void;
}): MenuResult => {
  const factory = useQuickActionsFactory();

  return {
    items: [factory.createCopyLinkMenuItem(props.handleCopyLink)],
    modals: null,
  };
};
