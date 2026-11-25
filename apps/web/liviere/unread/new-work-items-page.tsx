/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Liviere/plane fork: content of the route /:workspaceSlug/new-work-items – work items created by somebody
// else in my projects that I have not opened yet, newest first, with a project filter (?projects=a,b) and
// "Mark all as read". Opening one (peek or full page) removes it from the list and lowers the counter.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useRouter, useSearchParams } from "next/navigation";
import useSWRInfinite from "swr/infinite";
import { Button } from "@makeplane/propel/components/button";
import { ConfirmDialog } from "@plane/blocks/dialog";
import { EmptyStateCompact } from "@plane/blocks/empty-state";
import { setToast } from "@plane/blocks/toast";
import { useTranslation } from "@plane/i18n";
import { ListLoaderItemRow } from "@/components/ui/loader/layouts/list-layout-loader";
import { PageHead } from "@/components/core/page-title";
import { ProjectSelect } from "@/components/dropdowns/project/project-select";
import { HomePeekOverviewsRoot } from "@/components/issues/peek-overview/peek-overviews";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { NewWorkItemRow } from "./new-work-item-row";
import type { TNewWorkItemsPage } from "./types";
import { newWorkItemsService } from "./unread.service";
import {
  refreshNewWorkItems,
  useNewWorkItemsChanged,
  useNewWorkItemsCount,
  WORK_ITEM_OPENED_EVENT,
} from "./use-new-work-items";

type Props = {
  workspaceSlug: string;
};

const parseProjects = (value: string | null) => (value ? value.split(",").filter(Boolean) : []);

export const NewWorkItemsPage = observer(function NewWorkItemsPage(props: Props) {
  const { workspaceSlug } = props;
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [sentinel, setSentinel] = useState<HTMLDivElement | null>(null);
  const [openedIds, setOpenedIds] = useState<Set<string>>(() => new Set());
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isMarking, setIsMarking] = useState(false);

  const projectsParam = searchParams.get("projects");
  const projectIds = useMemo(() => parseProjects(projectsParam), [projectsParam]);
  const { data: counts } = useNewWorkItemsCount(workspaceSlug);

  const baseKey = `LIVIERE_NEW_LIST_${workspaceSlug}_${projectIds.join(",")}`;
  const { data, error, size, setSize, isLoading, isValidating, mutate } = useSWRInfinite(
    (index: number, previous: TNewWorkItemsPage | null) => {
      if (previous && !previous.has_more) return null;
      const last = previous?.results[previous.results.length - 1];
      return [baseKey, last?.created_at, last?.id];
    },
    ([, createdAt, id]: [string, string | undefined, string | undefined]) =>
      newWorkItemsService.list(workspaceSlug, projectIds, createdAt && id ? { created_at: createdAt, id } : undefined),
    { revalidateOnFocus: false, revalidateFirstPage: false }
  );

  // A work item opened in this tab disappears at once; the next reload drops it on the server side too
  useEffect(() => {
    const onOpened = (event: Event) => {
      const workItemId = (event as CustomEvent<{ workItemId: string }>).detail?.workItemId;
      if (workItemId) setOpenedIds((current) => new Set(current).add(workItemId));
    };
    window.addEventListener(WORK_ITEM_OPENED_EVENT, onOpened);
    return () => window.removeEventListener(WORK_ITEM_OPENED_EVENT, onOpened);
  }, []);

  const reload = useCallback(() => {
    void mutate();
  }, [mutate]);
  useNewWorkItemsChanged(reload);

  const items = useMemo(
    () => (data ?? []).flatMap((page) => page.results).filter((item) => !openedIds.has(item.id)),
    [data, openedIds]
  );
  // Server time of the first page: "Mark all as read" covers exactly what the list could show
  const asOf = data?.[0]?.as_of;
  const lastPage = data?.[data.length - 1];
  const hasMore = !!lastPage?.has_more;
  const isLoadingMore = isValidating && size > (data?.length ?? 0);
  useIntersectionObserver(
    containerRef,
    hasMore && !isLoadingMore ? sentinel : null,
    () => void setSize((current) => current + 1),
    "200px"
  );

  const setProjects = (ids: string[]) => {
    const params = new URLSearchParams(searchParams.toString());
    if (ids.length) params.set("projects", ids.join(","));
    else params.delete("projects");
    const query = params.toString();
    router.push(`/${workspaceSlug}/new-work-items${query ? `?${query}` : ""}`);
  };

  const markAllRead = async () => {
    if (!asOf) return;
    setIsMarking(true);
    try {
      const { cleared } = await newWorkItemsService.markAllRead(workspaceSlug, asOf, projectIds);
      setToast({ type: "success", title: t("liviere.unread.mark_all.done", { count: cleared }) });
      setIsConfirmOpen(false);
      refreshNewWorkItems();
    } catch {
      setToast({ type: "error", title: t("error"), message: t("liviere.unread.mark_all.error") });
    } finally {
      setIsMarking(false);
    }
  };

  const total = projectIds.length
    ? projectIds.reduce((sum, id) => sum + (counts?.by_project[id] ?? 0), 0)
    : (counts?.total ?? 0);

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-y-auto">
      <PageHead title={t("liviere.unread.title")} />
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-page-x py-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <h2 className="text-16 font-medium text-primary">{t("liviere.unread.title")}</h2>
            <p className="text-13 text-tertiary">{t("liviere.unread.description")}</p>
          </div>
          <div className="flex items-center gap-2">
            <ProjectSelect
              multiple
              value={projectIds}
              onChange={setProjects}
              variant="pill-sm"
              placeholder={t("liviere.unread.all_projects")}
              emptyIsValue
            />
            <Button
              variant="secondary"
              size="md"
              stretch="auto"
              label={t("liviere.unread.mark_all.button")}
              onClick={() => setIsConfirmOpen(true)}
              disabled={!asOf || items.length === 0}
            />
          </div>
        </div>

        {error ? (
          <p className="text-13 text-danger-primary">{t("liviere.unread.load_error")}</p>
        ) : isLoading || !data ? (
          <ListLoaderItemRow />
        ) : items.length === 0 ? (
          <EmptyStateCompact
            assetKey="work-item"
            title={t("liviere.unread.empty_title")}
            description={t("liviere.unread.empty_description")}
            rootClassName="py-16"
          />
        ) : (
          <div className="flex flex-col">
            {items.map((item) => (
              <NewWorkItemRow key={item.id} item={item} workspaceSlug={workspaceSlug} parentRef={containerRef} />
            ))}
            {hasMore &&
              (isLoadingMore ? (
                <ListLoaderItemRow />
              ) : (
                <div ref={setSentinel}>
                  <button
                    type="button"
                    onClick={() => void setSize(size + 1)}
                    className="flex h-11 items-center p-3 text-13 font-medium text-accent-primary hover:text-accent-secondary hover:underline"
                  >
                    {t("common.load_more")} ↓
                  </button>
                </div>
              ))}
          </div>
        )}
      </div>
      <ConfirmDialog
        isOpen={isConfirmOpen}
        handleClose={() => setIsConfirmOpen(false)}
        handleSubmit={() => void markAllRead()}
        isSubmitting={isMarking}
        title={t("liviere.unread.mark_all.title")}
        content={
          projectIds.length
            ? t("liviere.unread.mark_all.confirm_filtered", { count: total })
            : t("liviere.unread.mark_all.confirm", { count: total })
        }
        primaryButtonText={{
          loading: t("liviere.unread.mark_all.marking"),
          default: t("liviere.unread.mark_all.button"),
        }}
        secondaryButtonText={t("cancel")}
      />
      <HomePeekOverviewsRoot />
    </div>
  );
});
