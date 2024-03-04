import { Globe2, LayoutGrid, List, Lock } from "lucide-react";

export const PAGE_VIEW_LAYOUTS = [
  {
    key: "list",
    icon: List,
    title: "List layout",
  },
  {
    key: "detailed",
    icon: LayoutGrid,
    title: "Detailed layout",
  },
];

export const PAGE_TABS_LIST: { key: string; title: string }[] = [
  {
    key: "recent",
    title: "Recent",
  },
  {
    key: "all",
    title: "All",
  },
  {
    key: "favorites",
    title: "Favorites",
  },
  {
    key: "private",
    title: "Private",
  },
  {
    key: "shared",
    title: "Shared",
  },
  {
    key: "archived-pages",
    title: "Archived",
  },
];

export const PAGE_ACCESS_SPECIFIERS: { key: number; label: string; icon: any }[] = [
  {
    key: 0,
    label: "Public",
    icon: Globe2,
  },
  {
    key: 1,
    label: "Private",
    icon: Lock,
  },
];
