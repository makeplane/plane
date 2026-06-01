"use client";

import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IRosterFilters, IRosterPlayer, IRosterPlayerPayload, TRosterPlayerStatus } from "@plane/types";
import { useUserPermissions } from "@/hooks/store/user";
import { RosterService } from "@/services/roster.service";
import { getUniqueRosterValues } from "../utils/roster.utils";

export type TRosterFormState = {
  player_name: string;
  jersey_number: string;
  position: string;
  height: string;
  weight: string;
  class_year: string;
  status: TRosterPlayerStatus;
  notes: string;
};

export type TRosterDisplayPropertyKey =
  | "player"
  | "jersey_number"
  | "position"
  | "height"
  | "weight"
  | "class_year"
  | "status"
  | "notes"
  | "created_at"
  | "updated_at";

export type TRosterGroupByOption = "none" | "position" | "status" | "class_year";
export type TRosterOrderByOption =
  | "manual"
  | "player_name"
  | "jersey_number"
  | "position"
  | "status"
  | "created_at"
  | "updated_at";
export type TRosterViewOption = "list" | "grid";
export type TRosterGroupValue = Exclude<TRosterGroupByOption, "none">;
export type IRosterGroup = {
  key: string | null;
  label: string;
  count: number;
  players: IRosterPlayer[];
  sub_groups?: IRosterGroup[];
};

export type IRosterGroupedResponse = {
  grouped_by: TRosterGroupValue;
  sub_grouped_by: TRosterGroupValue | null;
  order_by: TRosterOrderByOption;
  results: IRosterGroup[];
};

type TRosterContext = {
  workspaceSlug: string;
  projectId: string;
  players: IRosterPlayer[];
  groupedRoster: IRosterGroupedResponse | null;
  allPlayers: IRosterPlayer[];
  statusOptions: string[];
  positionOptions: string[];
  classYearOptions: string[];
  isLoading: boolean;
  isSubmitting: boolean;
  canManage: boolean;
  searchValue: string;
  selectedPosition: string;
  selectedStatus: string;
  selectedClassYear: string;
  activeView: TRosterViewOption;
  displayProperties: Record<TRosterDisplayPropertyKey, boolean>;
  groupBy: TRosterGroupByOption;
  subGroupBy: TRosterGroupByOption;
  orderBy: TRosterOrderByOption;
  isAddPlayerModalOpen: boolean;
  isImportRosterModalOpen: boolean;
  editingPlayer: IRosterPlayer | null;
  deletingPlayer: IRosterPlayer | null;
  setSearchValue: (value: string) => void;
  setSelectedPosition: (value: string) => void;
  setSelectedStatus: (value: string) => void;
  setSelectedClassYear: (value: string) => void;
  setActiveView: (value: TRosterViewOption) => void;
  toggleDisplayProperty: (key: TRosterDisplayPropertyKey) => void;
  setGroupBy: (value: TRosterGroupByOption) => void;
  setSubGroupBy: (value: TRosterGroupByOption) => void;
  setOrderBy: (value: TRosterOrderByOption) => void;
  openCreatePlayerModal: () => void;
  openEditPlayerModal: (player: IRosterPlayer) => void;
  closePlayerModal: () => void;
  openImportRosterModal: () => void;
  closeImportRosterModal: () => void;
  openDeletePlayerModal: (player: IRosterPlayer) => void;
  closeDeletePlayerModal: () => void;
  submitPlayer: (payload: TRosterFormState) => Promise<void>;
  deletePlayer: () => Promise<void>;
  importPlayers: (players: IRosterPlayerPayload[]) => Promise<void>;
  refetchRoster: () => Promise<void>;
};

const RosterContext = createContext<TRosterContext | undefined>(undefined);

const rosterService = new RosterService();

const DEFAULT_FORM_STATE: TRosterFormState = {
  player_name: "",
  jersey_number: "",
  position: "",
  height: "",
  weight: "",
  class_year: "",
  status: "active",
  notes: "",
};

const DEFAULT_DISPLAY_PROPERTIES: Record<TRosterDisplayPropertyKey, boolean> = {
  player: true,
  jersey_number: true,
  position: true,
  height: true,
  weight: true,
  class_year: true,
  status: true,
  notes: false,
  created_at: false,
  updated_at: false,
};
const STATUS_ORDER: TRosterPlayerStatus[] = ["active", "injured", "inactive", "pending"];
const CLASS_YEAR_ORDER: Record<string, number> = {
  freshman: 1,
  sophomore: 2,
  junior: 3,
  senior: 4,
  graduate: 5,
};

const sortCollator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });

const normalizeValue = (value: string | null | undefined) => value?.trim() || "";

const parseNumberValue = (value: string | null | undefined) => {
  if (!value) return null;
  const parsedValue = Number.parseFloat(value.replace(/,/g, ""));
  return Number.isNaN(parsedValue) ? null : parsedValue;
};

const parseHeightValue = (value: string | null | undefined) => {
  const normalizedValue = normalizeValue(value).toLowerCase();
  if (!normalizedValue) return null;

  if (!normalizedValue.includes("'") && !normalizedValue.includes("ft")) return parseNumberValue(normalizedValue);

  const feetMatch = normalizedValue.match(/(\d+(?:\.\d+)?)\s*(?:'|ft)/);
  const inchesMatch = normalizedValue.match(/(?:'|ft)\s*(\d+(?:\.\d+)?)/);
  const feet = feetMatch ? Number.parseFloat(feetMatch[1]) : 0;
  const inches = inchesMatch ? Number.parseFloat(inchesMatch[1]) : 0;

  return feet || inches ? feet * 12 + inches : null;
};

const getPlayerSortValue = (player: IRosterPlayer, orderBy: TRosterOrderByOption) => {
  switch (orderBy) {
    case "player_name":
      return normalizeValue(player.player_name);
    case "jersey_number":
      return normalizeValue(player.jersey_number);
    case "position":
      return normalizeValue(player.position);
    case "status":
      return STATUS_ORDER.indexOf(player.status);
    case "created_at":
    case "updated_at": {
      const timestamp = Date.parse(player[orderBy]);
      return Number.isNaN(timestamp) ? null : timestamp;
    }
    default:
      return null;
  }
};

const sortPlayers = (players: IRosterPlayer[], orderBy: TRosterOrderByOption) => {
  if (orderBy === "manual") return players;

  return players
    .map((player, index) => ({ player, index }))
    .sort((currentPlayer, nextPlayer) => {
      const currentValue = getPlayerSortValue(currentPlayer.player, orderBy);
      const nextValue = getPlayerSortValue(nextPlayer.player, orderBy);
      const currentMissing = currentValue === null || currentValue === "";
      const nextMissing = nextValue === null || nextValue === "";

      if (currentMissing && nextMissing) return currentPlayer.index - nextPlayer.index;
      if (currentMissing) return 1;
      if (nextMissing) return -1;

      let sortResult = 0;
      if (typeof currentValue === "number" && typeof nextValue === "number") {
        sortResult = currentValue - nextValue;
      } else {
        sortResult = sortCollator.compare(String(currentValue), String(nextValue));
      }

      if (sortResult === 0) {
        return sortCollator.compare(
          normalizeValue(currentPlayer.player.player_name),
          normalizeValue(nextPlayer.player.player_name)
        );
      }

      if (orderBy === "created_at" || orderBy === "updated_at") return -sortResult;
      return sortResult;
    })
    .map(({ player }) => player);
};

const matchesSearch = (player: IRosterPlayer, searchTerm: string) => {
  if (!searchTerm) return true;

  const haystack = [
    player.player_name,
    player.jersey_number,
    player.position,
    player.class_year,
    player.status,
    player.height,
    player.weight,
    player.notes,
  ]
    .map((value) => normalizeValue(value).toLowerCase())
    .join(" ");

  return haystack.includes(searchTerm.toLowerCase());
};

const getGroupLabel = (field: TRosterGroupValue, value: string | null) => {
  if (!value) return "Unassigned";
  if (field === "status") return value.replace(/_/g, " ").replace(/\b\w/g, (match) => match.toUpperCase());
  return value;
};

type TRosterGroupSortKey = [number, number, string];

const getGroupSortKey = (field: TRosterGroupValue, value: string | null): TRosterGroupSortKey => {
  if (!value) return [1, Number.MAX_SAFE_INTEGER, ""];
  if (field === "status") {
    const statusIndex = STATUS_ORDER.indexOf(value as TRosterPlayerStatus);
    return [0, statusIndex >= 0 ? statusIndex : Number.MAX_SAFE_INTEGER, ""];
  }
  if (field === "class_year") {
    return [0, CLASS_YEAR_ORDER[value.toLowerCase()] ?? Number.MAX_SAFE_INTEGER, value.toLowerCase()];
  }
  return [0, 0, value.toLowerCase()];
};

const compareGroupSortKeys = (currentKey: TRosterGroupSortKey, nextKey: TRosterGroupSortKey) => {
  if (currentKey[0] !== nextKey[0]) return currentKey[0] - nextKey[0];
  if (currentKey[1] !== nextKey[1]) return currentKey[1] - nextKey[1];
  return sortCollator.compare(currentKey[2], nextKey[2]);
};

const buildGroupedRoster = (
  players: IRosterPlayer[],
  groupBy: TRosterGroupByOption,
  subGroupBy: TRosterGroupByOption,
  orderBy: TRosterOrderByOption
): IRosterGroupedResponse | null => {
  if (groupBy === "none") return null;

  const groupedResults = new Map<string | null, IRosterGroup & { sub_groups_map: Map<string | null, IRosterGroup> }>();

  players.forEach((player) => {
    const groupKey = (player[groupBy] as string | null) ?? null;
    const group = groupedResults.get(groupKey) ?? {
      key: groupKey,
      label: getGroupLabel(groupBy, groupKey),
      count: 0,
      players: [],
      sub_groups_map: new Map<string | null, IRosterGroup>(),
    };

    group.count += 1;

    if (subGroupBy !== "none") {
      const subGroupKey = (player[subGroupBy] as string | null) ?? null;
      const subGroup = group.sub_groups_map.get(subGroupKey) ?? {
        key: subGroupKey,
        label: getGroupLabel(subGroupBy, subGroupKey),
        count: 0,
        players: [],
      };

      subGroup.count += 1;
      subGroup.players.push(player);
      group.sub_groups_map.set(subGroupKey, subGroup);
    } else {
      group.players.push(player);
    }

    groupedResults.set(groupKey, group);
  });

  const results = Array.from(groupedResults.values())
    .sort((currentGroup, nextGroup) =>
      compareGroupSortKeys(getGroupSortKey(groupBy, currentGroup.key), getGroupSortKey(groupBy, nextGroup.key))
    )
    .map((group) => {
      const payload: IRosterGroup = {
        key: group.key,
        label: group.label,
        count: group.count,
        players: group.players,
      };

      if (subGroupBy !== "none") {
        payload.sub_groups = Array.from(group.sub_groups_map.values()).sort((currentGroup, nextGroup) =>
          compareGroupSortKeys(
            getGroupSortKey(subGroupBy, currentGroup.key),
            getGroupSortKey(subGroupBy, nextGroup.key)
          )
        );
      }

      return payload;
    });

  return {
    grouped_by: groupBy,
    sub_grouped_by: subGroupBy === "none" ? null : subGroupBy,
    order_by: orderBy,
    results,
  };
};

const normalizePayload = (payload: TRosterFormState): IRosterPlayerPayload => ({
  player_name: payload.player_name.trim(),
  jersey_number: payload.jersey_number.trim() || null,
  position: payload.position.trim() || null,
  height: payload.height.trim() || null,
  weight: payload.weight.trim() || null,
  class_year: payload.class_year.trim() || null,
  status: payload.status,
  notes: payload.notes.trim() || null,
});

const getErrorMessage = (error: unknown, fallback: string) => {
  if (!error || typeof error !== "object") return fallback;
  if ("error" in error && typeof error.error === "string") return error.error;
  if ("players" in error && Array.isArray(error.players) && typeof error.players[0] === "string")
    return error.players[0];
  const firstFieldError = Object.values(error)[0];
  if (typeof firstFieldError === "string") return firstFieldError;
  if (Array.isArray(firstFieldError) && typeof firstFieldError[0] === "string") return firstFieldError[0];
  return fallback;
};

export const RosterProvider = ({ children }: { children: ReactNode }) => {
  const { workspaceSlug, projectId } = useParams() as { workspaceSlug: string; projectId: string };
  const { allowPermissions } = useUserPermissions();
  const [allPlayers, setAllPlayers] = useState<IRosterPlayer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [selectedPosition, setSelectedPosition] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedClassYear, setSelectedClassYear] = useState("");
  const [activeView, setActiveView] = useState<TRosterViewOption>("list");
  const [displayProperties, setDisplayProperties] = useState(DEFAULT_DISPLAY_PROPERTIES);
  const [groupBy, setGroupBy] = useState<TRosterGroupByOption>("none");
  const [subGroupBy, setSubGroupBy] = useState<TRosterGroupByOption>("none");
  const [orderBy, setOrderBy] = useState<TRosterOrderByOption>("created_at");
  const [isAddPlayerModalOpen, setIsAddPlayerModalOpen] = useState(false);
  const [isImportRosterModalOpen, setIsImportRosterModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<IRosterPlayer | null>(null);
  const [deletingPlayer, setDeletingPlayer] = useState<IRosterPlayer | null>(null);
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const canManage = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.PROJECT,
    workspaceSlug,
    projectId
  );

  useEffect(() => {
    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    debounceTimeoutRef.current = setTimeout(() => setDebouncedSearch(searchValue.trim()), 300);
    return () => {
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    };
  }, [searchValue]);

  const activeFilters = useMemo<IRosterFilters>(
    () => ({
      search: debouncedSearch || undefined,
      position: selectedPosition || undefined,
      status: (selectedStatus as TRosterPlayerStatus) || undefined,
      class_year: selectedClassYear || undefined,
    }),
    [debouncedSearch, selectedClassYear, selectedPosition, selectedStatus]
  );

  const statusOptions = useMemo(() => getUniqueRosterValues(allPlayers, "status"), [allPlayers]);
  const positionOptions = useMemo(() => getUniqueRosterValues(allPlayers, "position"), [allPlayers]);
  const classYearOptions = useMemo(() => getUniqueRosterValues(allPlayers, "class_year"), [allPlayers]);
  const players = useMemo(() => {
    const filteredPlayers = allPlayers.filter(
      (player) =>
        matchesSearch(player, debouncedSearch) &&
        (!activeFilters.position || player.position === activeFilters.position) &&
        (!activeFilters.status || player.status === activeFilters.status) &&
        (!activeFilters.class_year || player.class_year === activeFilters.class_year)
    );

    return sortPlayers(filteredPlayers, orderBy);
  }, [activeFilters.class_year, activeFilters.position, activeFilters.status, allPlayers, debouncedSearch, orderBy]);
  const groupedRoster = useMemo(
    () => buildGroupedRoster(players, groupBy, subGroupBy, orderBy),
    [groupBy, orderBy, players, subGroupBy]
  );

  const refetchRoster = useCallback(async () => {
    setIsLoading(true);
    try {
      const roster = await rosterService.getRoster(workspaceSlug, projectId);
      setAllPlayers(roster);
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: getErrorMessage(error, "Roster could not be loaded. Please try again."),
      });
    } finally {
      setIsLoading(false);
    }
  }, [projectId, workspaceSlug]);

  useEffect(() => {
    refetchRoster();
  }, [refetchRoster]);

  const openCreatePlayerModal = () => {
    setEditingPlayer(null);
    setIsAddPlayerModalOpen(true);
  };

  const openEditPlayerModal = (player: IRosterPlayer) => {
    setEditingPlayer(player);
    setIsAddPlayerModalOpen(true);
  };

  const closePlayerModal = () => {
    setEditingPlayer(null);
    setIsAddPlayerModalOpen(false);
  };

  const openImportRosterModal = () => setIsImportRosterModalOpen(true);
  const closeImportRosterModal = () => setIsImportRosterModalOpen(false);
  const openDeletePlayerModal = (player: IRosterPlayer) => setDeletingPlayer(player);
  const closeDeletePlayerModal = () => setDeletingPlayer(null);
  const toggleDisplayProperty = (key: TRosterDisplayPropertyKey) =>
    setDisplayProperties((current) => ({ ...current, [key]: !current[key] }));
  const updateGroupBy = (value: TRosterGroupByOption) => {
    setGroupBy(value);
    if (value === "none") {
      setSubGroupBy("none");
      return;
    }
    if (subGroupBy === value) setSubGroupBy("none");
  };
  const updateSubGroupBy = (value: TRosterGroupByOption) => {
    if (groupBy === "none") {
      setGroupBy(value === "none" ? "none" : value);
      setSubGroupBy("none");
      return;
    }
    setSubGroupBy(value === groupBy ? "none" : value);
  };

  const submitPlayer = async (payload: TRosterFormState) => {
    setIsSubmitting(true);
    try {
      if (editingPlayer) {
        const updatedPlayer = await rosterService.updateRosterPlayer(
          workspaceSlug,
          projectId,
          editingPlayer.id,
          normalizePayload(payload)
        );
        setAllPlayers((currentPlayers) =>
          currentPlayers.map((player) => (player.id === updatedPlayer.id ? updatedPlayer : player))
        );
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: "Player updated successfully.",
        });
      } else {
        const createdPlayer = await rosterService.createRosterPlayer(
          workspaceSlug,
          projectId,
          normalizePayload(payload)
        );
        setAllPlayers((currentPlayers) => [...currentPlayers, createdPlayer]);
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: "Player added successfully.",
        });
      }

      closePlayerModal();
      await refetchRoster();
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: getErrorMessage(error, "Player could not be saved. Please try again."),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const deletePlayer = async () => {
    if (!deletingPlayer) return;

    setIsSubmitting(true);
    try {
      await rosterService.deleteRosterPlayer(workspaceSlug, projectId, deletingPlayer.id);
      setAllPlayers((currentPlayers) => currentPlayers.filter((player) => player.id !== deletingPlayer.id));
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success!",
        message: "Player deleted successfully.",
      });
      closeDeletePlayerModal();
      await refetchRoster();
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: getErrorMessage(error, "Player could not be deleted. Please try again."),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const importPlayers = async (playersToImport: IRosterPlayerPayload[]) => {
    setIsSubmitting(true);
    try {
      const response = await rosterService.importRoster(workspaceSlug, projectId, { players: playersToImport });
      setAllPlayers((currentPlayers) => [...currentPlayers, ...response.data]);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success!",
        message: response.message || "Roster imported successfully.",
      });
      closeImportRosterModal();
      await refetchRoster();
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: getErrorMessage(error, "Roster could not be imported. Please try again."),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <RosterContext.Provider
      value={{
        workspaceSlug,
        projectId,
        players,
        groupedRoster,
        allPlayers,
        statusOptions,
        positionOptions,
        classYearOptions,
        isLoading,
        isSubmitting,
        canManage,
        searchValue,
        selectedPosition,
        selectedStatus,
        selectedClassYear,
        activeView,
        displayProperties,
        groupBy,
        subGroupBy,
        orderBy,
        isAddPlayerModalOpen,
        isImportRosterModalOpen,
        editingPlayer,
        deletingPlayer,
        setSearchValue,
        setSelectedPosition,
        setSelectedStatus,
        setSelectedClassYear,
        setActiveView,
        toggleDisplayProperty,
        setGroupBy: updateGroupBy,
        setSubGroupBy: updateSubGroupBy,
        setOrderBy,
        openCreatePlayerModal,
        openEditPlayerModal,
        closePlayerModal,
        openImportRosterModal,
        closeImportRosterModal,
        openDeletePlayerModal,
        closeDeletePlayerModal,
        submitPlayer,
        deletePlayer,
        importPlayers,
        refetchRoster,
      }}
    >
      {children}
    </RosterContext.Provider>
  );
};

export const useRoster = () => {
  const context = useContext(RosterContext);
  if (!context) throw new Error("useRoster must be used within RosterProvider");
  return context;
};

export const getRosterFormState = (player?: IRosterPlayer | null): TRosterFormState =>
  player
    ? {
        player_name: player.player_name ?? "",
        jersey_number: player.jersey_number ?? "",
        position: player.position ?? "",
        height: player.height ?? "",
        weight: player.weight ?? "",
        class_year: player.class_year ?? "",
        status: player.status ?? "active",
        notes: player.notes ?? "",
      }
    : DEFAULT_FORM_STATE;
