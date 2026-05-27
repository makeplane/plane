"use client";

import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IRosterFilters, IRosterPlayer, IRosterPlayerPayload, TRosterPlayerStatus } from "@plane/types";
import { useUserPermissions } from "@/hooks/store/user";
import { RosterService } from "@/services/roster.service";
import { getUniqueRosterValues } from "./utils/roster.utils";

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
  | "-created_at"
  | "-updated_at";
export type TRosterViewOption = "list" | "grid";

type TRosterContext = {
  workspaceSlug: string;
  projectId: string;
  players: IRosterPlayer[];
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
  if ("players" in error && Array.isArray(error.players) && typeof error.players[0] === "string") return error.players[0];
  const firstFieldError = Object.values(error)[0];
  if (typeof firstFieldError === "string") return firstFieldError;
  if (Array.isArray(firstFieldError) && typeof firstFieldError[0] === "string") return firstFieldError[0];
  return fallback;
};

export const RosterProvider = ({ children }: { children: ReactNode }) => {
  const { workspaceSlug, projectId } = useParams() as { workspaceSlug: string; projectId: string };
  const { allowPermissions } = useUserPermissions();
  const [players, setPlayers] = useState<IRosterPlayer[]>([]);
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
  const [orderBy, setOrderBy] = useState<TRosterOrderByOption>("-created_at");
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

  const hasActiveFilters = useMemo(
    () => Boolean(activeFilters.search || activeFilters.position || activeFilters.status || activeFilters.class_year),
    [activeFilters]
  );

  const statusOptions = useMemo(() => getUniqueRosterValues(allPlayers, "status"), [allPlayers]);
  const positionOptions = useMemo(() => getUniqueRosterValues(allPlayers, "position"), [allPlayers]);
  const classYearOptions = useMemo(() => getUniqueRosterValues(allPlayers, "class_year"), [allPlayers]);

  const refetchRoster = useCallback(async () => {
    setIsLoading(true);
    try {
      const filteredRosterPromise = rosterService.getRoster(workspaceSlug, projectId, activeFilters);
      const allRosterPromise = hasActiveFilters
        ? rosterService.getRoster(workspaceSlug, projectId)
        : filteredRosterPromise;

      const [filteredRoster, unfilteredRoster] = await Promise.all([filteredRosterPromise, allRosterPromise]);
      setPlayers(filteredRoster);
      setAllPlayers(unfilteredRoster);
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: getErrorMessage(error, "Roster could not be loaded. Please try again."),
      });
    } finally {
      setIsLoading(false);
    }
  }, [activeFilters, hasActiveFilters, projectId, workspaceSlug]);

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
        setPlayers((currentPlayers) =>
          currentPlayers.map((player) => (player.id === updatedPlayer.id ? updatedPlayer : player))
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
        setPlayers((currentPlayers) => [...currentPlayers, createdPlayer]);
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
      setPlayers((currentPlayers) => currentPlayers.filter((player) => player.id !== deletingPlayer.id));
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
      setPlayers((currentPlayers) => [...currentPlayers, ...response.data]);
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
        setGroupBy,
        setSubGroupBy,
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
