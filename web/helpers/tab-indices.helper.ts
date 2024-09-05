import { ETabIndices, TAB_INDEX_MAP } from "@/constants/tab-indices";

export const getTabIndex = (type?: ETabIndices, isMobile: boolean = false) => {
  const getIndex = (key: string) =>
    isMobile ? undefined : type && TAB_INDEX_MAP[type].findIndex((tabIndex) => tabIndex === key) + 1;

  const baseTabIndex = isMobile ? -1 : 1;

  return { getIndex, baseTabIndex };
};
