import { Copy } from "lucide-react";
import { TContextMenuItem } from "@plane/ui";

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
}

export const createCopyMenuWithDuplication = (props: CopyMenuHelperProps): TContextMenuItem => {
  const { baseItem } = props;

  return baseItem;
};
