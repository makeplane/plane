// types
import type { ICycle, IModule, IProjectView, IWorkspaceView } from "@plane/types";
import type { TContextMenuItem } from "@plane/ui";
// hooks
import { useQuickActionsFactory } from "@/plane-web/components/common/quick-actions-factory";

// Types
interface UseCycleMenuItemsProps {
  cycleDetails: ICycle | undefined;
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

interface UseModuleMenuItemsProps {
  moduleDetails: IModule | undefined;
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

interface UseViewMenuItemsProps {
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

interface UseLayoutMenuItemsProps {
  workspaceSlug: string;
  projectId: string;
  storeType: "PROJECT" | "EPIC";
  handleCopyLink: () => void;
  handleOpenInNewTab: () => void;
}

type MenuResult = {
  items: TContextMenuItem[];
  modals: JSX.Element | null;
};

export const useCycleMenuItems = (props: UseCycleMenuItemsProps): MenuResult => {
  const factory = useQuickActionsFactory();
  const { cycleDetails, isEditingAllowed, ...handlers } = props;

  const isArchived = !!cycleDetails?.archived_at;
  const isCompleted = cycleDetails?.status?.toLowerCase() === "completed";

  // Assemble final menu items - order defined here
  const items = [
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
  ].filter((item) => item.shouldRender !== false);

  return { items, modals: null };
};

export const useModuleMenuItems = (props: UseModuleMenuItemsProps): MenuResult => {
  const factory = useQuickActionsFactory();
  const { moduleDetails, isEditingAllowed, ...handlers } = props;

  const isArchived = !!moduleDetails?.archived_at;
  const moduleState = moduleDetails?.status?.toLocaleLowerCase();
  const isInArchivableGroup = !!moduleState && ["completed", "cancelled"].includes(moduleState);

  // Assemble final menu items - order defined here
  const items = [
    factory.createEditMenuItem(handlers.handleEdit, isEditingAllowed && !isArchived),
    factory.createOpenInNewTabMenuItem(handlers.handleOpenInNewTab),
    factory.createCopyLinkMenuItem(handlers.handleCopyLink),
    factory.createArchiveMenuItem(handlers.handleArchive, {
      shouldRender: isEditingAllowed && !isArchived,
      disabled: !isInArchivableGroup,
      description: isInArchivableGroup ? undefined : "Only completed or cancelled modules can be archived",
    }),
    factory.createRestoreMenuItem(handlers.handleRestore, isEditingAllowed && isArchived),
    factory.createDeleteMenuItem(handlers.handleDelete, isEditingAllowed && !isArchived),
  ].filter((item) => item.shouldRender !== false);

  return { items, modals: null };
};

export const useViewMenuItems = (props: UseViewMenuItemsProps): MenuResult => {
  const factory = useQuickActionsFactory();
  const { workspaceSlug, isOwner, isAdmin, projectId, view, ...handlers } = props;

  if (!view) return { items: [], modals: null };

  // Assemble final menu items - order defined here
  const items = [
    factory.createEditMenuItem(handlers.handleEdit, isOwner),
    factory.createOpenInNewTabMenuItem(handlers.handleOpenInNewTab),
    factory.createCopyLinkMenuItem(handlers.handleCopyLink),
    factory.createDeleteMenuItem(handlers.handleDelete, isOwner || isAdmin),
  ].filter((item) => item.shouldRender !== false);

  return { items, modals: null };
};

export const useLayoutMenuItems = (props: UseLayoutMenuItemsProps): MenuResult => {
  const factory = useQuickActionsFactory();
  const { ...handlers } = props;

  // Assemble final menu items - order defined here
  const items = [
    factory.createOpenInNewTab(handlers.handleOpenInNewTab),
    factory.createCopyLayoutLinkMenuItem(handlers.handleCopyLink),
  ].filter((item) => item.shouldRender !== false);

  return { items, modals: null };
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const useIntakeHeaderMenuItems = (props: {
  workspaceSlug: string;
  projectId: string;
  handleCopyLink: () => void;
}): MenuResult => ({ items: [], modals: null });
