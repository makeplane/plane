import { useState } from "react";
import { observer } from "mobx-react";
import { ChevronDown } from "lucide-react";
import { useParams } from "react-router";
import useSWR from "swr";
import { EPageAccess } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import type { TWikiScope } from "@plane/types";
import { CustomMenu } from "@plane/ui";
import { EPageStoreType, usePageStore } from "../../../hooks/store";
import { useAppRouter } from "../../../hooks/use-app-router";
import { resolveDefaultWikiScope } from "../../../helpers/wiki-access";
import { getWikiPagePath } from "../../../helpers/wiki-routes";
import { WikiService } from "../../../services/wiki.service";
import { buildWikiSidebarModel, getCreatableWikiScopes } from "./model";
import { WikiPersonalSections } from "./personal-sections";
import { WikiWorkspaceSection } from "./workspace-section";

const wikiService = new WikiService();

export const WikiSidebar = observer(function WikiSidebar({ onNavigate }: { onNavigate: () => void }) {
  const { workspaceSlug, pageId, collectionId } = useParams();
  const { data: scopes, error, isLoading, mutate } = useSWR("WIKI_SCOPES", () => wikiService.fetchScopes());
  const pageStore = usePageStore(EPageStoreType.WORKSPACE);
  const { t } = useTranslation();
  const router = useAppRouter();
  const [isCreating, setCreating] = useState(false);
  const defaultSlug = resolveDefaultWikiScope(scopes ?? [])?.slug ?? "";
  const model = buildWikiSidebarModel(scopes ?? [], defaultSlug, workspaceSlug, pageId);
  const creatableScopes = getCreatableWikiScopes(scopes ?? []);
  const defaultCreatableScope = creatableScopes.find((scope) => scope.is_default);
  const workspaceCreatableScopes = creatableScopes.filter((scope) => !scope.is_default);

  const createPage = async (scope: TWikiScope) => {
    if (!scope.can_create || isCreating) return;
    setCreating(true);
    try {
      pageStore.activateScope(scope.slug);
      const page = await pageStore.createPage({ name: t("wiki.untitled"), access: EPageAccess.PUBLIC });
      if (page?.id) {
        router.push(getWikiPagePath(scope.slug, page.id));
        onNavigate();
      }
    } catch (creationError) {
      console.error("Could not create Wiki page", creationError);
    } finally {
      setCreating(false);
    }
  };

  return (
    <nav aria-label={t("wiki.sidebar.title")} className="h-full overflow-y-auto px-2 py-3">
      <div className="mb-3 flex items-center justify-between px-2">
        <h2 className="text-14 font-semibold text-primary">{t("wiki.sidebar.title")}</h2>
      </div>
      {creatableScopes.length > 0 && (
        <CustomMenu
          customButton={
            <span className="flex w-full items-center justify-between rounded-md bg-accent-primary px-3 py-2 text-left text-13 font-medium text-white">
              <span>+ {t("wiki.sidebar.new_page")}</span>
              <ChevronDown className="size-3.5" />
            </span>
          }
          customButtonClassName="w-full focus-visible:outline-accent-primary focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50"
          className="mb-3 w-full"
          placement="bottom-start"
          optionsClassName="min-w-56 max-w-72"
          ariaLabel={t("wiki.sidebar.new_page")}
          disabled={isCreating}
          closeOnSelect
        >
          {defaultCreatableScope && (
            <CustomMenu.MenuItem onClick={() => void createPage(defaultCreatableScope)}>
              <span className="flex min-w-0 flex-col">
                <span className="truncate font-medium text-primary">{t("wiki.sidebar.instance_wiki")}</span>
                {defaultCreatableScope.name !== t("wiki.sidebar.instance_wiki") && (
                  <span className="truncate text-10 text-tertiary">{defaultCreatableScope.name}</span>
                )}
              </span>
            </CustomMenu.MenuItem>
          )}
          {workspaceCreatableScopes.length > 0 && (
            <>
              <div className="px-1 pb-1 pt-2 text-10 font-semibold tracking-wide text-tertiary uppercase">
                {t("wiki.sidebar.workspaces")}
              </div>
              {workspaceCreatableScopes.map((scope) => (
                <CustomMenu.MenuItem key={scope.id} onClick={() => void createPage(scope)}>
                  <span className="block truncate font-medium text-primary">{scope.name}</span>
                </CustomMenu.MenuItem>
              ))}
            </>
          )}
        </CustomMenu>
      )}
      {isLoading && (
        <div className="space-y-2 p-2" aria-label={t("wiki.sidebar.loading")}>
          <div className="h-5 w-4/5 animate-pulse rounded bg-layer-1 motion-reduce:animate-none" />
          <div className="h-5 w-2/3 animate-pulse rounded bg-layer-1 motion-reduce:animate-none" />
        </div>
      )}
      {error && (
        <div role="alert" className="p-2 text-12">
          {t("wiki.sidebar.load_failed")}{" "}
          <button type="button" onClick={() => void mutate()} className="text-accent-primary">
            {t("wiki.sidebar.retry")}
          </button>
        </div>
      )}
      {model.defaultScope && (
        <WikiWorkspaceSection
          scope={model.defaultScope}
          label={model.defaultScope.label}
          activeSlug={workspaceSlug}
          activePageId={pageId}
          activeCollectionId={collectionId}
          initiallyExpanded
          isDefaultScope
          onNavigate={onNavigate}
        />
      )}
      {model.workspaces.length > 0 && (
        <div className="my-3 border-t border-subtle pt-2">
          <p className="px-2 py-1 text-11 font-semibold tracking-wide text-tertiary uppercase">
            {t("wiki.sidebar.workspaces")}
          </p>
          {model.workspaces.map((scope) => (
            <WikiWorkspaceSection
              key={scope.id}
              scope={scope}
              label={scope.label}
              activeSlug={workspaceSlug}
              activePageId={pageId}
              activeCollectionId={collectionId}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
      <WikiPersonalSections onNavigate={onNavigate} />
    </nav>
  );
});
