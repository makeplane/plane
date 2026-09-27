import type { TPage, TPageCollectionPage, TWikiScope } from "@plane/types";
import { getWikiHomePath, getWikiPagePath } from "../../../helpers/wiki-routes";
import type { IWikiNavigationStore } from "../../../store/wiki/wiki-navigation.store";

export type WikiSidebarScope = TWikiScope & { label: string; href: string; active: boolean };

export function getCreatableWikiScopes(scopes: TWikiScope[]): TWikiScope[] {
  return scopes
    .filter((scope) => scope.can_create && (scope.is_default || scope.is_member))
    .sort((a, b) => {
      if (a.is_default !== b.is_default) return a.is_default ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
}

export function buildWikiSidebarModel(
  scopes: TWikiScope[],
  defaultSlug: string,
  activeSlug?: string,
  _activePageId?: string
): {
  defaultScope: WikiSidebarScope | undefined;
  workspaces: WikiSidebarScope[];
  pageHref: (slug: string, pageId: string) => string;
} {
  const available = scopes.filter((scope) => scope.is_default || scope.is_member);
  const decorate = (scope: TWikiScope): WikiSidebarScope => ({
    ...scope,
    label: scope.name,
    href: getWikiHomePath(scope.slug),
    active: scope.slug === activeSlug,
  });
  const defaultScope = available.find((scope) => scope.slug === defaultSlug && scope.is_default);
  return {
    defaultScope: defaultScope ? decorate(defaultScope) : undefined,
    workspaces: available.filter((scope) => scope.slug !== defaultSlug && scope.is_member).map(decorate),
    pageHref: getWikiPagePath,
  };
}

export async function expandWikiWorkspace(store: IWikiNavigationStore, slug: string): Promise<void> {
  if (store.getScope(slug).status === "idle" || store.getScope(slug).status === "error") {
    await store.fetchScope(slug);
  }
}

export function getCollectionSubtreePages(pages: TPage[], associations: TPageCollectionPage[]): TPage[] {
  const included = new Set(associations.map((item) => item.page));
  let changed = true;
  while (changed) {
    changed = false;
    for (const page of pages) {
      if (!page.id || included.has(page.id) || page.deleted_at || page.archived_at) continue;
      if (page.parent && included.has(page.parent)) {
        included.add(page.id);
        changed = true;
      }
    }
  }
  return pages.filter((page) => !!page.id && included.has(page.id));
}

export function getLooseWikiPages(
  pages: TPage[],
  collectionPagesById: Record<string, TPageCollectionPage[]>
): TPage[] {
  const claimed = new Set<string>();
  for (const associations of Object.values(collectionPagesById)) {
    for (const page of getCollectionSubtreePages(pages, associations)) {
      if (page.id) claimed.add(page.id);
    }
  }
  return pages.filter((page) => !page.id || !claimed.has(page.id));
}
