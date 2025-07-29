import { useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
// plane editor
import { TEmbedConfig, TEmbedItem, TIssueEmbedConfig, TPageEmbedConfig } from "@plane/editor";
// plane types
import { TPage, TSearchEntityRequestPayload, TSearchResponse } from "@plane/types";
// plane ui
import { PriorityIcon, setToast, TOAST_TYPE } from "@plane/ui";
// plane web components
import { IssueEmbedCard, IssueEmbedUpgradeCard, PageEmbedCardRoot } from "@/plane-web/components/pages";
import { useFlag } from "@/plane-web/hooks/store/use-flag";
// store
import { TPageInstance } from "@/store/pages/base-page";
// plane web hooks
import { EPageStoreType, usePageStore } from "./store/use-page-store";

export type TEmbedHookProps = {
  fetchEmbedSuggestions?: (payload: TSearchEntityRequestPayload) => Promise<TSearchResponse>;
  projectId?: string;
  workspaceSlug?: string;
  page?: TPageInstance;
  getRedirectionLink?: (pageId?: string) => string;
  storeType: EPageStoreType;
  setDeletePageModal?: (params: { visible: boolean; pages: TPageInstance[] }) => void;
};

export const useEditorEmbeds = (props: TEmbedHookProps) => {
  const { fetchEmbedSuggestions, projectId, workspaceSlug, page, getRedirectionLink, storeType, setDeletePageModal } =
    props;
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
    if (
      !storeType ||
      !page ||
      !getPageById ||
      !createPage ||
      !getRedirectionLink ||
      storeType !== EPageStoreType.WORKSPACE
    ) {
      return undefined;
    }

    return {
      createCallback: async () => {
        const payload: Partial<TPage> = {
          access: page.access,
          name: "",
          parent_id: page.id,
        };
        const res = await createPage(payload);

        return {
          pageId: res?.id ?? "",
          projectId: projectIdFromParams?.toString() ?? "",
          workspaceSlug: workspaceSlug?.toString() ?? "",
        };
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
            const page = getPageById(pageId);
            if (page) {
              pages.push(page);
            }
          }
          if (setDeletePageModal && pages.length > 0) {
            setDeletePageModal({ visible: true, pages: pages });
          }
        } catch {}
      },
      archivePage: async (pageId: string) => {
        try {
          const page = getPageById(pageId);
          page?.archive({ shouldSync: true });
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: "Success!",
            message: `${page?.name} archived successfully.`,
          });
        } catch {}
      },
      unarchivePage: async (pageId: string) => {
        try {
          const page = getPageById(pageId);
          page?.restore({ shouldSync: true });
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: "Success!",
            message: `${page?.name} restored successfully.`,
          });
        } catch {}
      },
      workspaceSlug: workspaceSlug?.toString() ?? "",
    };
  }, [
    storeType,
    page,
    getPageById,
    createPage,
    getRedirectionLink,
    projectIdFromParams,
    workspaceSlug,
    setDeletePageModal,
  ]);

  const embedProps: TEmbedConfig = useMemo(
    () => ({
      issue: issueEmbedProps,
      ...(pageEmbedProps && { page: pageEmbedProps }),
    }),
    [issueEmbedProps, pageEmbedProps]
  );

  return {
    embedProps,
    issueEmbedProps,
    pageEmbedProps,
  };
};
