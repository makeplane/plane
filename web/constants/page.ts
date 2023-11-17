import { LayoutGrid, List } from "lucide-react";

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
		title: "Archived"
	}
];
