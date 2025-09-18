import { Dispatch, RefObject, SetStateAction } from "react";
import { LucideIcon } from "lucide-react";
// plane imports
import { ISvgIcons } from "@plane/propel/icons";
import { TPage, TPageNavigationTabs } from "@plane/types";

// Basic section details type
export type SectionDetails = {
  label: string;
  icon: LucideIcon | React.FC<ISvgIcons>;
};

// Map of section types to details
export type SectionDetailsMap = {
  [key in TPageNavigationTabs]: SectionDetails;
};

// Props for section header
export interface SectionHeaderProps {
  sectionType: TPageNavigationTabs;
  sectionDetails: SectionDetails;
  isCreatingPage: TPageNavigationTabs | null;
  handleCreatePage: (pageType: TPageNavigationTabs) => void;
  buttonRef?: RefObject<HTMLButtonElement>;
  onButtonClick?: () => void;
}

// Props for section content
export interface SectionContentProps {
  pageIds: string[];
  sectionType: TPageNavigationTabs;
  expandedPageIds?: string[];
  setExpandedPageIds?: Dispatch<SetStateAction<string[]>>;
}

// Props for main section component
export interface SectionRootProps {
  currentPageId?: string;
  expandedPageIds?: string[];
  sectionType: TPageNavigationTabs;
  setExpandedPageIds?: Dispatch<SetStateAction<string[]>>;
}

// Return type for drag and drop hook
export interface DragAndDropHookReturn {
  isDropping: boolean;
}
