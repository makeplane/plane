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

export const PAGE_EMPTY_STATE_DETAILS = {
  All: {
    key: "all",
    title: "Write a note, a doc, or a full knowledge base",
    description:
      "Pages help you organise your thoughts to create wikis, discussions or even document heated takes for your project. Use it wisely!",
  },
  Favorites: {
    key: "favorites",
    title: "No favorite pages yet",
    description: "Favorites for quick access? mark them and find them right here.",
  },
  Private: {
    key: "private",
    title: "No private pages yet",
    description: "Keep your private thoughts here. When you're ready to share, the team's just a click away.",
  },
  Shared: {
    key: "shared",
    title: "No shared pages yet",
    description: "See pages shared with everyone in your project right here.",
  },
  Archived: {
    key: "archived",
    title: "No archived pages yet",
    description: "Archive pages not on your radar. Access them here when needed.",
  },
  Recent: {
    key: "recent",
    title: "Write a note, a doc, or a full knowledge base",
    description:
      "Pages help you organise your thoughts to create wikis, discussions or even document heated takes for your project. Use it wisely! Pages will be sorted and grouped by last updated",
  },
};
