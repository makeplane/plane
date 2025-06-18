import { Copy } from "lucide-react";
import { TContextMenuItem } from "@plane/ui";
// lib
import { store } from "@/lib/store-context";
// hooks

export interface CopyMenuHelperProps {
  baseItem: {
    key: string;
    title: string;
    icon: typeof Copy;
    action: () => void;
    shouldRender: boolean;
  };
  activeLayout: string;
  setTrackElement: (element: string) => void;
  setCreateUpdateIssueModal: (open: boolean) => void;
  setDuplicateWorkItemModal?: (open: boolean) => void;
  workspaceSlug?: string;
}

export const createCopyMenuWithDuplication = (props: CopyMenuHelperProps): TContextMenuItem => {
  const {
    baseItem,
    activeLayout,
    setTrackElement,
    setCreateUpdateIssueModal,
    setDuplicateWorkItemModal,
    workspaceSlug,
  } = props;

  const isDuplicateEnabled = workspaceSlug ? store.featureFlags.flags[workspaceSlug]?.COPY_WORK_ITEM : false;

  if (setDuplicateWorkItemModal && isDuplicateEnabled) {
    return {
      ...baseItem,
      nestedMenuItems: [
        {
          key: "copy-in-same-project",
          title: "Copy in same project",
          action: () => {
            setTrackElement(activeLayout);
            setCreateUpdateIssueModal(true);
          },
        },
        {
          key: "copy-in-different-project",
          title: "Copy in different project",
          action: () => {
            setDuplicateWorkItemModal(true);
          },
        },
      ],
    };
  }

  return baseItem;
};
