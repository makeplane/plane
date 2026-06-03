"use client";

import type { ChangeEvent, DragEvent, ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { ChevronDown, FileSpreadsheet, Upload, X } from "lucide-react";
import { Button } from "@plane/propel/button";
import type { IRosterPlayerPayload, TRosterPlayerStatus } from "@plane/types";
import { AlertModalCore, cn, CustomSelect, EModalPosition, EModalWidth, Input, ModalCore, TextArea } from "@plane/ui";
import { STATUS_SELECT_OPTIONS } from "../constants/roster.constants";
import type { TRosterFormState } from "../store/roster-context";
import { getRosterFormState, useRoster } from "../store/roster-context";
import { mapImportedRows, toDisplayStatus } from "../utils/roster.utils";

const FieldLabel = ({ children }: { children: ReactNode }) => (
  <label className="text-xs font-medium uppercase tracking-wide text-custom-text-400">{children}</label>
);

export const AddPlayerModal = observer(({ isOpen, onClose }: { isOpen?: boolean; onClose?: () => void }) => {
  const { editingPlayer, isAddPlayerModalOpen, isSubmitting, closePlayerModal, submitPlayer } = useRoster();
  const [formState, setFormState] = useState<TRosterFormState>(getRosterFormState(editingPlayer));
  const modalOpen = isOpen ?? isAddPlayerModalOpen;
  const handleClose = onClose ?? closePlayerModal;

  useEffect(() => {
    setFormState(getRosterFormState(editingPlayer));
  }, [editingPlayer, modalOpen]);

  const updateField = <K extends keyof TRosterFormState>(key: K, value: TRosterFormState[K]) =>
    setFormState((currentState) => ({ ...currentState, [key]: value }));

  return (
    <ModalCore isOpen={modalOpen} handleClose={handleClose} position={EModalPosition.TOP} width={EModalWidth.XXXL}>
      <div className="border-b border-custom-border-200 px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-custom-text-100">{editingPlayer ? "Edit player" : "Add player"}</h3>
            <p className="mt-1 text-sm text-custom-text-300">Create and manage player roster details for this program.</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-md p-1.5 text-custom-text-400 transition-colors hover:bg-custom-background-90 hover:text-custom-text-200"
            aria-label="Close player modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submitPlayer(formState);
        }}
      >
        <div className="grid gap-4 p-5 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <FieldLabel>Player name</FieldLabel>
            <Input
              value={formState.player_name}
              onChange={(event) => updateField("player_name", event.target.value)}
              placeholder="Enter player name"
              className="w-full border-custom-border-200 bg-custom-background-100"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <FieldLabel>Jersey number</FieldLabel>
            <Input
              value={formState.jersey_number}
              onChange={(event) => updateField("jersey_number", event.target.value)}
              placeholder="17"
              className="w-full border-custom-border-200 bg-custom-background-100"
            />
          </div>
          <div className="space-y-2">
            <FieldLabel>Position</FieldLabel>
            <Input
              value={formState.position}
              onChange={(event) => updateField("position", event.target.value)}
              placeholder="QB"
              className="w-full border-custom-border-200 bg-custom-background-100"
            />
          </div>
          <div className="space-y-2">
            <FieldLabel>Height</FieldLabel>
            <Input
              value={formState.height}
              onChange={(event) => updateField("height", event.target.value)}
              placeholder={"6'2\""}
              className="w-full border-custom-border-200 bg-custom-background-100"
            />
          </div>
          <div className="space-y-2">
            <FieldLabel>Weight</FieldLabel>
            <Input
              value={formState.weight}
              onChange={(event) => updateField("weight", event.target.value)}
              placeholder="205 lb"
              className="w-full border-custom-border-200 bg-custom-background-100"
            />
          </div>
          <div className="space-y-2">
            <FieldLabel>Class/Year</FieldLabel>
            <Input
              value={formState.class_year}
              onChange={(event) => updateField("class_year", event.target.value)}
              placeholder="Senior"
              className="w-full border-custom-border-200 bg-custom-background-100"
            />
          </div>
          <div className="space-y-2">
            <FieldLabel>Status</FieldLabel>
            <CustomSelect
              value={formState.status}
              onChange={(selected: TRosterPlayerStatus) => updateField("status", selected)}
              label={<span className="text-sm text-custom-text-200">{toDisplayStatus(formState.status)}</span>}
              buttonClassName="w-full justify-between rounded-md border-custom-border-200 bg-custom-background-100 px-3 py-2 text-sm text-custom-text-200"
            >
              {STATUS_SELECT_OPTIONS.map((option) => (
                <CustomSelect.Option key={option.value} value={option.value}>
                  {option.label}
                </CustomSelect.Option>
              ))}
            </CustomSelect>
          </div>
          <div className="space-y-2 md:col-span-2">
            <FieldLabel>Notes</FieldLabel>
            <TextArea
              value={formState.notes}
              onChange={(event) => updateField("notes", event.target.value)}
              placeholder="Add optional notes about the player"
              className="min-h-28 w-full resize-none border-custom-border-200 bg-custom-background-100"
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-custom-border-200 px-5 py-4">
          <Button variant="neutral-primary" size="sm" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" loading={isSubmitting}>
            {editingPlayer ? "Save changes" : "Save player"}
          </Button>
        </div>
      </form>
    </ModalCore>
  );
});

export const ImportRosterModal = observer(({ isOpen, onClose }: { isOpen?: boolean; onClose?: () => void }) => {
  const { isImportRosterModalOpen, isSubmitting, closeImportRosterModal, importPlayers, pendingImportFile, setPendingImportFile } =
    useRoster();
  const modalOpen = isOpen ?? isImportRosterModalOpen;
  const handleClose = onClose ?? closeImportRosterModal;
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [parsedRows, setParsedRows] = useState<IRosterPlayerPayload[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!modalOpen) {
      setSelectedFileName("");
      setParsedRows([]);
      setParseError(null);
      setIsParsing(false);
      setIsDragging(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [modalOpen]);

  const parseRosterFile = useCallback(async (file: File) => {
    setSelectedFileName(file.name);
    setParseError(null);
    setIsParsing(true);

    try {
      const normalizedFileName = file.name.trim().toLowerCase();
      if (!normalizedFileName.endsWith(".xlsx") && !normalizedFileName.endsWith(".csv")) {
        throw new Error("Only .xlsx and .csv files are supported.");
      }

      const xlsxModule = await import("xlsx");
      const XLSX = "default" in xlsxModule ? xlsxModule.default : xlsxModule;
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const firstSheet = firstSheetName ? workbook.Sheets[firstSheetName] : undefined;

      if (!firstSheet) throw new Error("The selected file does not contain any readable sheets.");

      const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, {
        defval: "",
        raw: false,
      });
      const normalizedRows = mapImportedRows(rawRows);

      if (!normalizedRows.length) throw new Error("No roster rows were found in the selected file.");
      if (!normalizedRows.some((row) => row.player_name)) {
        throw new Error("The file must include a player name column with at least one value.");
      }

      setParsedRows(normalizedRows);
    } catch (error) {
      setParsedRows([]);
      setParseError(error instanceof Error ? error.message : "The selected file could not be parsed.");
    } finally {
      setIsParsing(false);
    }
  }, []);

  useEffect(() => {
    if (!modalOpen || !pendingImportFile) return;

    parseRosterFile(pendingImportFile);
    setPendingImportFile(null);
  }, [modalOpen, parseRosterFile, pendingImportFile, setPendingImportFile]);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = event.target.files?.[0];
    if (!file) return;

    await parseRosterFile(file);
    input.value = "";
  };

  const handleFileDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];
    if (!file) return;

    await parseRosterFile(file);
  };

  return (
    <ModalCore isOpen={modalOpen} handleClose={handleClose} position={EModalPosition.TOP} width={EModalWidth.XXXXL}>
      <div className="border-b border-custom-border-200 px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-custom-text-100">Import roster</h3>
            <p className="mt-1 text-sm text-custom-text-300">
              Upload a roster file with player name, jersey number, position, height, weight, and status.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-md p-1.5 text-custom-text-400 transition-colors hover:bg-custom-background-90 hover:text-custom-text-200"
            aria-label="Close import roster modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="space-y-5 p-5">
        <div
          className={cn(
            "rounded-xl border border-dashed p-6 transition-colors",
            isDragging
              ? "border-custom-primary-100 bg-custom-primary-100/10"
              : "border-custom-border-300 bg-custom-background-90"
          )}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleFileDrop}
        >
          <div className="flex flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-custom-border-200 bg-custom-background-100 text-custom-text-300">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div className="text-sm font-medium text-custom-text-100">Drop `.xlsx` or `.csv` file here</div>
            <div className="mt-1 text-sm text-custom-text-300">Browse a local file to preview and import roster rows.</div>
            <a
              href="/templates/roster-template.xlsx"
              download="roster-template.xlsx"
              className="mt-2 text-sm font-medium text-custom-primary-100 transition-colors hover:text-custom-primary-200 hover:underline"
            >
              Download roster template
            </a>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              variant="neutral-primary"
              size="sm"
              prependIcon={<Upload />}
              className="mt-4"
              onClick={() => fileInputRef.current?.click()}
              disabled={isParsing || isSubmitting}
            >
              Choose file
            </Button>
            {selectedFileName ? <p className="mt-3 text-xs text-custom-text-400">{selectedFileName}</p> : null}
            {isParsing ? <p className="mt-3 text-xs text-custom-text-400">Parsing roster file...</p> : null}
            {parseError ? <p className="mt-3 text-xs text-red-400">{parseError}</p> : null}
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-custom-text-100">Preview</h4>
            {parsedRows.length ? (
              <div className="flex items-center gap-1 text-xs text-custom-text-400">
                {parsedRows.length} row{parsedRows.length === 1 ? "" : "s"} ready
                <ChevronDown className="h-3.5 w-3.5" />
              </div>
            ) : null}
          </div>
          <div className="rounded-lg border border-custom-border-200 bg-custom-background-100">
            <div className="max-h-[36vh] overflow-auto">
            <table className="min-w-full whitespace-nowrap">
              <thead className="sticky top-0 z-[1] border-b border-custom-border-200 bg-custom-background-90">
                <tr className="text-left text-xs font-medium uppercase tracking-wide text-custom-text-400">
                  <th className="px-4 py-3">Player</th>
                  <th className="px-4 py-3">Jersey #</th>
                  <th className="px-4 py-3">Position</th>
                  <th className="px-4 py-3">Height</th>
                  <th className="px-4 py-3">Weight</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {parsedRows.length ? (
                  parsedRows.map((row, index) => (
                    <tr
                      key={`${row.player_name}-${row.jersey_number ?? index}`}
                      className="border-b border-custom-border-200 text-sm text-custom-text-200 last:border-b-0"
                    >
                      <td className="px-4 py-3">{row.player_name || "—"}</td>
                      <td className="px-4 py-3">{row.jersey_number ? `#${row.jersey_number}` : "—"}</td>
                      <td className="px-4 py-3">{row.position || "—"}</td>
                      <td className="px-4 py-3">{row.height || "—"}</td>
                      <td className="px-4 py-3">{row.weight || "—"}</td>
                      <td className="px-4 py-3">{toDisplayStatus(row.status || "active")}</td>
                    </tr>
                  ))
                ) : (
                  <tr className="text-sm text-custom-text-300">
                    <td className="px-4 py-6 text-center" colSpan={6}>
                      Choose a roster file to preview imported rows.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-end gap-2 border-t border-custom-border-200 px-5 py-4">
        <Button variant="neutral-primary" size="sm" onClick={handleClose}>
          Close
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={() => importPlayers(parsedRows)}
          disabled={!parsedRows.length || isParsing}
          loading={isSubmitting}
        >
          Import roster
        </Button>
      </div>
    </ModalCore>
  );
});

export const DeletePlayerModal = observer(() => {
  const { deletingPlayer, isSubmitting, closeDeletePlayerModal, deletePlayer } = useRoster();

  return (
    <AlertModalCore
      isOpen={!!deletingPlayer}
      handleClose={closeDeletePlayerModal}
      handleSubmit={deletePlayer}
      isSubmitting={isSubmitting}
      title="Delete player"
      content={`Are you sure you want to delete ${deletingPlayer?.player_name ?? "this player"} from the roster?`}
      primaryButtonText={{ loading: "Deleting", default: "Delete player" }}
    />
  );
});
