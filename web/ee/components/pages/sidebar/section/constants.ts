import { ArchiveIcon, Globe2, Lock, Share } from "lucide-react";
import { TPageNavigationTabs } from "@plane/types";
import { SectionDetailsMap } from "./types";

// Constants for section details
export const SECTION_DETAILS: SectionDetailsMap = {
  public: {
    label: "Public",
    icon: Globe2,
  },
  private: {
    label: "Private",
    icon: Lock,
  },
  archived: {
    label: "Archived",
    icon: ArchiveIcon,
  },
  shared: {
    label: "Shared",
    icon: Share,
  },
};
