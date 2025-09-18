import { useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
// plane imports
import { DEFAULT_PAGE_SORT_ORDER, PAGE_SORT_ORDER_INCREMENT, WORKSPACE_PAGE_TRACKER_EVENTS } from "@plane/constants";
import type { TEmbedConfig, TEmbedItem, TIssueEmbedConfig, TPageEmbedConfig } from "@plane/editor";
import { PriorityIcon } from "@plane/propel/icons";
import type { TPage, TSearchEntityRequestPayload, TSearchResponse } from "@plane/types";
// plane ui
import { setToast, TOAST_TYPE } from "@plane/ui";
// helpers
import { captureError, captureSuccess } from "@/helpers/event-tracker.helper";
// plane web components
import { IssueEmbedCard, IssueEmbedUpgradeCard, PageEmbedCardRoot } from "@/plane-web/components/pages";
import { EmbedHandler } from "@/plane-web/components/pages/editor/external-embed/embed-handler";
// plane web hooks
import { EPageStoreType, usePageStore } from "@/plane-web/hooks/store";
import { useFlag } from "@/plane-web/hooks/store/use-flag";
// store
import type { TPageInstance } from "@/store/pages/base-page";

export type TEmbedHookProps = {
  fetchEmbedSuggestions?: (payload: TSearchEntityRequestPayload) => Promise<TSearchResponse>;
  projectId?: string;
  workspaceSlug?: string;
  page?: TPageInstance;
  getRedirectionLink?: (pageId?: string) => string;
  storeType: EPageStoreType;
};

export const useEditorEmbeds = (props: TEmbedHookProps) => {
  const { fetchEmbedSuggestions, projectId, workspaceSlug, page, getRedirectionLink, storeType } = props;
  const { projectId: projectIdFromParams } = useParams();

  // store hooks
  const isIssueEmbedEnabled = useFlag(workspaceSlug, "PAGE_ISSUE_EMBEDS");
  const { getPageById, createPage } = usePageStore(storeType);

  // Issue Embed Implementation
  const fetchIssues = useCallback(
    async (searchQuery: string): Promise<TEmbedItem[]> => {
      const response = await fetchEmbedSuggestions?.({
        query_type: ["issue"],
        query: searchQuery,
        count: 10,
      });
      const structuredIssues: TEmbedItem[] = (response?.issue ?? []).map((issue) => ({
        id: issue.id,
        subTitle: `${issue.project__identifier}-${issue.sequence_id}`,
        title: issue.name,
        icon: <PriorityIcon priority={issue.priority} />,
        projectId: issue.project_id?.toString() ?? "",
        workspaceSlug: workspaceSlug?.toString() ?? "",
      }));
      return structuredIssues;
    },
    [fetchEmbedSuggestions, workspaceSlug]
  );

  const issueSearchCallback: TIssueEmbedConfig["searchCallback"] = useCallback(
    async (query: string): Promise<TEmbedItem[]> =>
      new Promise((resolve) => {
        setTimeout(async () => {
          const response = await fetchIssues(query);
          resolve(response);
        }, 300);
      }),
    [fetchIssues]
  );

  const issueWidgetCallback: TIssueEmbedConfig["widgetCallback"] = useCallback(
    ({ issueId, projectId: projectIdFromEmbed, workspaceSlug: workspaceSlugFromEmbed }) => {
      const resolvedProjectId = projectIdFromEmbed ?? projectId?.toString() ?? projectIdFromParams?.toString() ?? "";
      const resolvedWorkspaceSlug = workspaceSlugFromEmbed ?? workspaceSlug?.toString() ?? "";
      return <IssueEmbedCard issueId={issueId} projectId={resolvedProjectId} workspaceSlug={resolvedWorkspaceSlug} />;
    },
    [projectId, projectIdFromParams, workspaceSlug]
  );

  const upgradeCallback = useCallback(() => <IssueEmbedUpgradeCard />, []);

  const issueEmbedProps: TIssueEmbedConfig = useMemo(
    () => ({
      searchCallback: isIssueEmbedEnabled ? issueSearchCallback : undefined,
      widgetCallback: isIssueEmbedEnabled ? issueWidgetCallback : upgradeCallback,
    }),
    [isIssueEmbedEnabled, issueSearchCallback, upgradeCallback, issueWidgetCallback]
  );

  // Page Embed Implementation
  const pageEmbedProps: TPageEmbedConfig | undefined = useMemo(() => {
    if (!storeType || !page || !getPageById || !createPage || !getRedirectionLink) {
      return undefined;
    }

    return {
      createCallback: async (index) => {
        const { subPages } = page;
        let sortOrder: number = DEFAULT_PAGE_SORT_ORDER;

        if (subPages.length > 0) {
          if (index === 0) {
            const currentFirstPageSortOrder = subPages[0].sort_order;
            if (currentFirstPageSortOrder !== undefined) {
              sortOrder = currentFirstPageSortOrder - PAGE_SORT_ORDER_INCREMENT;
            }
          } else if (index >= subPages.length) {
            const currentLastPageSortOrder = subPages[subPages.length - 1].sort_order;
            if (currentLastPageSortOrder !== undefined) {
              sortOrder = currentLastPageSortOrder + PAGE_SORT_ORDER_INCREMENT;
            }
          } else {
            const currentPrevPageSortOrder = subPages[index - 1].sort_order;
            const currentPageSortOrder = subPages[index].sort_order;
            if (currentPrevPageSortOrder !== undefined && currentPageSortOrder !== undefined) {
              sortOrder = (currentPrevPageSortOrder + currentPageSortOrder) / 2;
            }
          }
        }

        const payload: Partial<TPage> = {
          access: page.access,
          name: "",
          parent_id: page.id,
          sort_order: sortOrder,
        };
        try {
          const res = await createPage(payload);

          captureSuccess({
            eventName: WORKSPACE_PAGE_TRACKER_EVENTS.nested_page_create,
            payload: {
              id: res?.id,
              state: "SUCCESS",
            },
          });
          return {
            pageId: res?.id ?? "",
            workspaceSlug: workspaceSlug?.toString() ?? "",
          };
        } catch (error) {
          console.log(error);
          captureError({
            eventName: WORKSPACE_PAGE_TRACKER_EVENTS.nested_page_create,
            payload: {
              state: "ERROR",
            },
          });
        }
      },
      widgetCallback: ({ pageId: pageIdFromNode, updateAttributes }) => (
        <PageEmbedCardRoot
          parentPage={page}
          embedPageId={pageIdFromNode}
          storeType={storeType}
          redirectLink={getRedirectionLink(pageIdFromNode)}
          onPageDrop={(droppedPageId: string) => {
            const droppedPageDetails = getPageById(droppedPageId);
            droppedPageDetails?.update({ parent_id: pageIdFromNode });
          }}
          isDroppable
          updateAttributes={updateAttributes}
        />
      ),
      getSubPagesCallback: () => page.subPageIds,
      getPageDetailsCallback: (pageId) => {
        const page = getPageById(pageId);
        if (!page) throw new Error("Page not found");
        return page;
      },
      deletePage: async (pageIds) => {
        try {
          const pages = [] as TPageInstance[];
          for (const pageId of pageIds) {
            const pageInstance = getPageById(pageId);
            if (pageInstance) {
              pages.push(pageInstance);
            }
          }
          if (page && pages.length > 0) {
            page.openDeletePageModal(pages);
          }
        } catch {}
      },
      archivePage: async (pageId: string) => {
        const page = getPageById(pageId);
        if (!page) return;
        try {
          await page?.archive({ shouldSync: true });
          captureSuccess({
            eventName: WORKSPACE_PAGE_TRACKER_EVENTS.nested_page_archive,
            payload: {
              id: page?.id,
              state: "SUCCESS",
            },
          });
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: "Success!",
            message: `${page?.name} archived successfully.`,
          });
        } catch {
          captureError({
            eventName: WORKSPACE_PAGE_TRACKER_EVENTS.nested_page_archive,
            payload: {
              id: page?.id,
              state: "ERROR",
            },
          });
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Error!",
            message: "Failed to archive page. Please try again later.",
          });
        }
      },
      unarchivePage: async (pageId: string) => {
        try {
          const page = getPageById(pageId);
          await page?.restore({ shouldSync: true });
          captureSuccess({
            eventName: WORKSPACE_PAGE_TRACKER_EVENTS.nested_page_restore,
            payload: {
              id: page?.id,
              state: "SUCCESS",
            },
          });
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: "Success!",
            message: `${page?.name} restored successfully.`,
          });
        } catch {
          captureError({
            eventName: WORKSPACE_PAGE_TRACKER_EVENTS.nested_page_restore,
            payload: {
              id: page?.id,
              state: "ERROR",
            },
          });
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Error!",
            message: "Failed to restore page. Please try again later.",
          });
        }
      },
      workspaceSlug: workspaceSlug?.toString() ?? "",
      onNodesPosChanged: (updatedSubPages) => {
        const { subPages } = page;
        // check if anything has changed
        const hasChanged = updatedSubPages.some((updatedSubPage) => {
          const subPageIndex = subPages.findIndex((subPage) => subPage.id === updatedSubPage.id);
          return subPageIndex !== updatedSubPage.index;
        });
        if (!hasChanged) return;
        const subPageMap = new Map(subPages.map((subPage) => [subPage.id, subPage.sort_order]));

        updatedSubPages.forEach((updatedSubPage, index) => {
          const currentSortOrder = subPageMap.get(updatedSubPage.id);
          if (currentSortOrder === undefined) return;

          let newSortOrder: number | null = null;

          if (index === 0) {
            const nextSortOrder = subPageMap.get(updatedSubPages[1]?.id);
            if (nextSortOrder !== undefined && currentSortOrder >= nextSortOrder) {
              newSortOrder = nextSortOrder - PAGE_SORT_ORDER_INCREMENT;
            }
          } else if (index === updatedSubPages.length - 1) {
            const prevSortOrder = subPageMap.get(updatedSubPages[index - 1]?.id);
            if (prevSortOrder !== undefined && currentSortOrder <= prevSortOrder) {
              newSortOrder = prevSortOrder + PAGE_SORT_ORDER_INCREMENT;
            }
          } else {
            const prevSortOrder = subPageMap.get(updatedSubPages[index - 1]?.id);
            const nextSortOrder = subPageMap.get(updatedSubPages[index + 1]?.id);
            if (prevSortOrder !== undefined && nextSortOrder !== undefined) {
              if (currentSortOrder <= prevSortOrder || currentSortOrder >= nextSortOrder) {
                newSortOrder = (prevSortOrder + nextSortOrder) / 2;
              }
            }
          }

          if (newSortOrder !== null) {
            getPageById(updatedSubPage.id)?.update({ sort_order: newSortOrder });
            subPageMap.set(updatedSubPage.id, newSortOrder);
          }
        });
      },
    };
  }, [storeType, page, getPageById, createPage, getRedirectionLink, workspaceSlug]);

  const embedProps: TEmbedConfig = useMemo(
    () => ({
      issue: issueEmbedProps,
      ...(pageEmbedProps && { page: pageEmbedProps }),
      externalEmbedComponent: { widgetCallback: EmbedHandler },
    }),
    [issueEmbedProps, pageEmbedProps]
  );

  return {
    embedProps,
    issueEmbedProps,
    pageEmbedProps,
  };
};
