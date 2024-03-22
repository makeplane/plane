// types
import { TPage, TPageNavigationTabs } from "@plane/types";

interface IPageHelpers {
  filterPagesByPages: (pageType: TPageNavigationTabs, pages: TPage[]) => TPage[];
  isCurrentUserOwner: (page: TPage, userId: string) => boolean;
}

export class PageHelpers implements IPageHelpers {
  constructor() {}

  filterPagesByPages = (pageType: TPageNavigationTabs, pages: TPage[]) =>
    pages.filter((page) => {
      if (pageType === "public") return page.access === 0;
      if (pageType === "private") return page.access === 1;
      if (pageType === "archived") return page.archived_at !== undefined;
      return true;
    });

  isCurrentUserOwner(page: TPage, userId: string) {
    return page?.owned_by === userId;
  }
}
