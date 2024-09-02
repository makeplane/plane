import { ETabIndices, TAB_INDEX_MAP } from "@/constants/tab-indices";

export const getTabIndex = (key: string, type: ETabIndices, isMobile: boolean = false) =>
  isMobile ? undefined : TAB_INDEX_MAP[type].findIndex((tabIndex) => tabIndex === key) + 1;
