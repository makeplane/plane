import { useEffect, useMemo, useState } from "react";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TMediaArtifact } from "@/services/media-library.service";
import type { TMediaItem } from "ce/features/media-library/types/media-library.types";
import { buildMediaThumbnailLookup, resolveTagRowArtifactThumbnail } from "../media-thumbnail-lookup";
import { buildMockFootballRows } from "../mock-football-rows";
import type { RowFilterMode, SgTagRow, SgTagRowEditPayload, SportTableKind } from "../types";

type UseSgEventTagStateArgs = {
  cpServerBaseUrl: string;
  manifestArtifacts: TMediaArtifact[] | undefined;
  mediaItems: TMediaItem[] | undefined;
  onActiveTagRemoved: (tagId: string) => void;
  packageId: string | undefined;
  projectId: string;
  sport: SportTableKind;
  tagRows: SgTagRow[];
  workspaceSlug: string;
};

export const useSgEventTagState = ({
  cpServerBaseUrl,
  manifestArtifacts,
  mediaItems,
  onActiveTagRemoved,
  packageId,
  projectId,
  sport,
  tagRows,
  workspaceSlug,
}: UseSgEventTagStateArgs) => {
  const [selectedGroupValue, setSelectedGroupValue] = useState<string>("All tags");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [favoriteTagIds, setFavoriteTagIds] = useState<string[]>([]);
  const [removedTagIds, setRemovedTagIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [rowFilterMode, setRowFilterMode] = useState<RowFilterMode>("all");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [focusedMatrixRows, setFocusedMatrixRows] = useState<SgTagRow[]>([]);
  const [editedTagRowsById, setEditedTagRowsById] = useState<Record<string, Partial<SgTagRow>>>({});

  const mediaThumbnailLookup = useMemo(
    () =>
      buildMediaThumbnailLookup(mediaItems, manifestArtifacts, {
        packageId,
        projectId,
        workspaceSlug,
      }),
    [manifestArtifacts, mediaItems, packageId, projectId, workspaceSlug]
  );
  const tagRowsWithThumbnails = useMemo(
    () =>
      tagRows.map((row) => {
        const editedRow = editedTagRowsById[row.id];
        const mergedRow = editedRow ? { ...row, ...editedRow } : row;
        const thumbnailUrl = resolveTagRowArtifactThumbnail(mergedRow, mediaThumbnailLookup, cpServerBaseUrl);
        return thumbnailUrl && thumbnailUrl !== mergedRow.thumbnailUrl ? { ...mergedRow, thumbnailUrl } : mergedRow;
      }),
    [cpServerBaseUrl, editedTagRowsById, mediaThumbnailLookup, tagRows]
  );
  const availableGroups = useMemo(
    () => Array.from(new Set(tagRowsWithThumbnails.map((row) => row.groupValue))),
    [tagRowsWithThumbnails]
  );
  const tagTypeRows = useMemo(
    () => tagRowsWithThumbnails.filter((row) => !removedTagIds.includes(row.id)),
    [removedTagIds, tagRowsWithThumbnails]
  );
  const effectiveGroupValue =
    selectedGroupValue === "All tags" || availableGroups.includes(selectedGroupValue)
      ? selectedGroupValue
      : availableGroups[0] || "All tags";
  const filteredRows = useMemo(
    () =>
      tagRowsWithThumbnails.filter((row) => {
        if (removedTagIds.includes(row.id)) return false;
        if (effectiveGroupValue !== "All tags" && row.groupValue !== effectiveGroupValue) return false;
        if (rowFilterMode === "favorites" && !favoriteTagIds.includes(row.id)) return false;
        if (rowFilterMode === "selected" && !selectedTagIds.includes(row.id)) return false;
        if (!searchQuery.trim()) return true;

        const haystack = [
          row.player,
          row.action,
          row.groupValue,
          row.result,
          row.team,
          row.timecode,
          row.primaryDetail,
          row.secondaryDetail,
        ]
          .join(" ")
          .toLowerCase();

        return haystack.includes(searchQuery.trim().toLowerCase());
      }),
    [
      effectiveGroupValue,
      favoriteTagIds,
      removedTagIds,
      rowFilterMode,
      searchQuery,
      selectedTagIds,
      tagRowsWithThumbnails,
    ]
  );
  const allVisibleSelected = filteredRows.length > 0 && filteredRows.every((row) => selectedTagIds.includes(row.id));
  const selectedRows = useMemo(
    () => tagRowsWithThumbnails.filter((row) => selectedTagIds.includes(row.id) && !removedTagIds.includes(row.id)),
    [removedTagIds, selectedTagIds, tagRowsWithThumbnails]
  );
  const matrixRows = useMemo(() => {
    const realRows = tagRowsWithThumbnails.filter((row) => !removedTagIds.includes(row.id));
    if (realRows.length > 0 || sport !== "american-football") return realRows;
    return buildMockFootballRows();
  }, [removedTagIds, sport, tagRowsWithThumbnails]);
  const playlistPanelRows = focusedMatrixRows.filter((row) => !removedTagIds.includes(row.id));

  useEffect(() => {
    if (selectedGroupValue === "All tags") return;
    if (availableGroups.length === 0) return;
    if (!availableGroups.includes(selectedGroupValue)) {
      setSelectedGroupValue(availableGroups[0]);
    }
  }, [availableGroups, selectedGroupValue]);

  const handleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedTagIds((currentValue) => currentValue.filter((id) => !filteredRows.some((row) => row.id === id)));
      return;
    }

    setSelectedTagIds((currentValue) => Array.from(new Set([...currentValue, ...filteredRows.map((row) => row.id)])));
  };

  const handleToggleTagSelection = (tagId: string) => {
    setSelectedTagIds((currentValue) =>
      currentValue.includes(tagId) ? currentValue.filter((id) => id !== tagId) : [...currentValue, tagId]
    );
  };

  const handleToggleFavorite = (tagId: string) => {
    setFavoriteTagIds((currentValue) =>
      currentValue.includes(tagId) ? currentValue.filter((value) => value !== tagId) : [...currentValue, tagId]
    );
  };

  const handleToggleSearch = () => {
    if (isSearchOpen && !searchQuery) {
      setIsSearchOpen(false);
      return;
    }

    setIsSearchOpen(true);
  };

  const handleRemoveTag = (tagId: string) => {
    setRemovedTagIds((currentValue) => (currentValue.includes(tagId) ? currentValue : [...currentValue, tagId]));
    onActiveTagRemoved(tagId);
    setSelectedTagIds((currentValue) => currentValue.filter((id) => id !== tagId));
    setFavoriteTagIds((currentValue) => currentValue.filter((id) => id !== tagId));
  };

  const handleUpdateTag = (tagId: string, updates: SgTagRowEditPayload) => {
    setEditedTagRowsById((currentValue) => ({
      ...currentValue,
      [tagId]: {
        ...(currentValue[tagId] ?? {}),
        ...updates,
      },
    }));
    setToast({
      type: TOAST_TYPE.SUCCESS,
      title: "Tag updated",
      message: "The list row has been updated.",
    });
  };

  const handleCreateMatrixCard = (rows: SgTagRow[]) => {
    setSelectedTagIds(rows.map((row) => row.id));
    setToast({
      type: TOAST_TYPE.SUCCESS,
      title: "Card selection ready",
      message: `${rows.length} tag${rows.length === 1 ? "" : "s"} selected for card creation.`,
    });
  };

  const clearSelectedTagIds = () => {
    setSelectedTagIds([]);
  };

  return {
    allVisibleSelected,
    availableGroups,
    clearSelectedTagIds,
    effectiveGroupValue,
    favoriteTagIds,
    filteredRows,
    handleCreateMatrixCard,
    handleRemoveTag,
    handleSelectAll,
    handleToggleFavorite,
    handleToggleSearch,
    handleToggleTagSelection,
    handleUpdateTag,
    isSearchOpen,
    matrixRows,
    playlistPanelRows,
    rowFilterMode,
    searchQuery,
    selectedRows,
    selectedTagIds,
    setFocusedMatrixRows,
    setRowFilterMode,
    setSearchQuery,
    setSelectedGroupValue,
    tagTypeRows,
  };
};
