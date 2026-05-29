import type { ISvgIcons } from "@plane/propel/icons";
import type { TContextMenuItem } from "@plane/ui";

export interface CopyMenuHelperProps {
  baseItem: {
    key: string;
    title: string;
    icon: React.FC<ISvgIcons>;
    action: () => void;
    shouldRender: boolean;
  };
  activeLayout: string;
  setCreateUpdateIssueModal: (open: boolean) => void;
  setDuplicateWorkItemModal?: (open: boolean) => void;
  workspaceSlug?: string;
}

export const createCopyMenuWithDuplication = (props: CopyMenuHelperProps): TContextMenuItem => {
  const { baseItem } = props;

  return baseItem;
};
