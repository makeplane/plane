import { useMemo, useState } from "react";
import { ChevronDown, PanelsTopLeft, X } from "lucide-react";
import { Dialog } from "@headlessui/react";
import type { IRosterPlayer } from "@plane/types";
import { EModalWidth, ModalCore } from "@plane/ui";
import { cn } from "@plane/utils";
import type { TCustomPlaylist } from "@/services/media-library.service";
import { buildCardPlaylists, CARD_PROGRESS_OPTIONS, formatCardDuration, formatCardPlayer } from "./create-card-model";
import type { CardFormValues, CardProgressStatus } from "./create-card-model";
import { CardClipThumbnail, CreateCardPreview } from "./create-card-preview";
import { CreateCardRosterPicker } from "./create-card-roster-picker";
import { CreateCardScrollArea } from "./create-card-scroll-area";
import type { SgTagRow } from "./types";

type Props = {
  playlists: TCustomPlaylist[];
  rows: SgTagRow[];
  rosterPlayers: IRosterPlayer[];
  isRosterLoading: boolean;
  hasRosterError: boolean;
  onRetryRoster: () => void;
  onClose: () => void;
  onSubmit?: (values: CardFormValues) => Promise<void>;
  sportLabel: string;
};

export const CreateCardModal = ({
  playlists,
  rows,
  rosterPlayers,
  isRosterLoading,
  hasRosterError,
  onRetryRoster,
  onClose,
  onSubmit,
  sportLabel,
}: Props) => {
  const groups = useMemo(() => buildCardPlaylists(playlists, rows), [playlists, rows]);
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(() => groups[0]?.id ?? null);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [feedback, setFeedback] = useState("");
  const [progressStatus, setProgressStatus] = useState<CardProgressStatus>("New Player");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const selectedPlayers = useMemo(
    () => selectedPlayerIds.flatMap((id) => rosterPlayers.find((player) => player.id === id) ?? []),
    [rosterPlayers, selectedPlayerIds]
  );
  const includedPlaylists = useMemo(() => groups.filter((group) => group.clips.length > 0), [groups]);
  const totalTags = includedPlaylists.reduce((total, group) => total + group.clips.length, 0);
  const canSubmit =
    Boolean(onSubmit) &&
    selectedPlayers.length > 0 &&
    totalTags > 0 &&
    !isRosterLoading &&
    !hasRosterError &&
    !isSubmitting;
  const handleClose = () => {
    if (!isSubmitting) onClose();
  };

  return (
    <ModalCore isOpen handleClose={handleClose} width={EModalWidth.XXXXL} className="border border-custom-border-300">
      <form
        className="flex max-h-[calc(100dvh-2rem)] min-h-0 flex-col"
        onSubmit={async (event) => {
          event.preventDefault();
          if (!canSubmit || !onSubmit) return;
          setIsSubmitting(true);
          setSubmitError("");
          try {
            await onSubmit({
              playerIds: selectedPlayers.map((player) => player.id),
              feedback: feedback.trim(),
              progressStatus,
              playlists: includedPlaylists.map((group) => ({
                id: group.id,
                clipIds: group.clips.map((clip) => clip.id),
              })),
            });
            onClose();
          } catch {
            setSubmitError("Unable to send this card. Your selections and feedback are still here; please try again.");
          } finally {
            setIsSubmitting(false);
          }
        }}
      >
        <div className="flex shrink-0 items-center justify-between px-5 pb-3 pt-4">
          <Dialog.Title as="h2" className="text-xl font-semibold text-custom-text-100">
            Create Card
          </Dialog.Title>
          <button
            type="button"
            aria-label="Close create card"
            onClick={handleClose}
            disabled={isSubmitting}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-custom-border-200 text-custom-text-300 hover:bg-custom-background-90 disabled:opacity-40"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="min-h-0 overflow-y-auto px-5 pb-5">
          <div className="grid items-start gap-5 md:grid-cols-[280px_minmax(0,1fr)]">
            <CreateCardPreview
              players={selectedPlayers}
              playlists={includedPlaylists}
              feedback={feedback}
              progressStatus={progressStatus}
              sportLabel={sportLabel}
            />
            <div className="min-w-0 space-y-4">
              <CreateCardRosterPicker
                players={rosterPlayers}
                selectedPlayers={selectedPlayers}
                onChange={setSelectedPlayerIds}
                isLoading={isRosterLoading}
                hasError={hasRosterError}
                onRetry={onRetryRoster}
              />
              <section>
                <label htmlFor="create-card-feedback" className="text-sm text-custom-text-200">
                  Feedback
                </label>
                <textarea
                  id="create-card-feedback"
                  value={feedback}
                  onChange={(event) => setFeedback(event.target.value)}
                  placeholder="Add feedback for this session…"
                  className="mt-2 min-h-20 w-full resize-y rounded-lg border border-custom-border-300 bg-custom-background-90 p-3 text-sm text-custom-text-100 outline-none placeholder:text-custom-text-300 focus:border-custom-primary-100"
                />
              </section>
              <fieldset>
                <legend className="text-sm text-custom-text-200">Player Progress Status</legend>
                <div className="mt-2 flex flex-wrap gap-2 rounded-lg border border-custom-border-300 bg-custom-background-90 p-2">
                  {CARD_PROGRESS_OPTIONS.map((option) => (
                    <label
                      key={option}
                      className={cn("cursor-pointer", option !== "New Player" && "cursor-not-allowed opacity-45")}
                      title={option === "New Player" ? undefined : "This progress status is not available yet"}
                    >
                      <input
                        type="radio"
                        name="card-progress"
                        value={option}
                        checked={progressStatus === option}
                        disabled={option !== "New Player"}
                        onChange={() => setProgressStatus(option)}
                        className="peer sr-only"
                      />
                      <span className="inline-flex rounded-md border border-custom-border-300 px-3 py-1.5 text-xs text-custom-text-300 transition-colors peer-checked:border-custom-primary-100 peer-checked:bg-custom-primary-10 peer-checked:text-custom-primary-100 peer-focus-visible:ring-2 peer-focus-visible:ring-custom-primary-100">
                        {option}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <section aria-label="Play Context">
                <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <h3 className="text-sm text-custom-text-200">Play Context</h3>
                    <span className="text-[11px] text-custom-text-300">playlists & tags included in this card</span>
                  </div>
                  <span className="text-[11px] text-custom-text-300" aria-live="polite">
                    {totalTags} tags
                  </span>
                </div>
                <div className="space-y-2">
                  {groups.map((group) => {
                    const isCollapsed = expandedGroupId !== group.id;
                    const listId = `card-playlist-clips-${group.id}`;
                    return (
                      <div
                        key={group.id}
                        className="overflow-hidden rounded-lg border border-custom-border-300 bg-custom-background-90"
                      >
                        <div className="flex min-h-10 items-center gap-2 px-3">
                          <button
                            type="button"
                            onClick={() => setExpandedGroupId((current) => (current === group.id ? null : group.id))}
                            aria-expanded={!isCollapsed}
                            aria-controls={listId}
                            className="flex min-w-0 flex-1 items-center gap-2 py-2 text-left"
                          >
                            <span className="truncate text-sm text-custom-text-100" title={group.name}>
                              {group.name}
                            </span>
                            <span className="shrink-0 text-[11px] text-custom-text-300">
                              <span className="text-custom-primary-100">{group.clips.length}</span> tag
                              {group.clips.length === 1 ? "" : "s"}
                            </span>
                            <ChevronDown
                              className={cn(
                                "ml-auto h-3.5 w-3.5 shrink-0 text-custom-text-300 transition-transform",
                                isCollapsed && "-rotate-90"
                              )}
                            />
                          </button>
                        </div>
                        <CreateCardScrollArea
                          id={listId}
                          hidden={isCollapsed}
                          className="max-h-[min(38dvh,360px)] border-t border-custom-border-200"
                          message="Scroll for more tags"
                          refreshKey={`${group.clips.length}:${isCollapsed}`}
                        >
                          {group.clips.length ? (
                            group.clips.map((clip) => (
                              <div
                                key={clip.key}
                                className="flex items-center gap-2 py-2 pl-5 pr-3 hover:bg-custom-background-80 sm:pl-8"
                              >
                                <CardClipThumbnail clip={clip} className="h-9 w-14" />
                                <span className="min-w-0 flex-1">
                                  <span
                                    className="block truncate text-xs uppercase text-custom-text-100"
                                    title={clip.title}
                                  >
                                    {clip.title}
                                  </span>
                                  <span className="mt-0.5 flex flex-wrap items-center gap-x-1 text-[10px] text-custom-text-200">
                                    {[clip.team, clip.detail].filter(Boolean).join(" | ")}
                                    {clip.result && <span className="text-custom-primary-100">{clip.result}</span>}
                                    {clip.secondaryDetail && <span> | {clip.secondaryDetail}</span>}
                                  </span>
                                </span>
                                <span
                                  className="shrink-0 text-[11px] tabular-nums text-custom-text-300"
                                  title={clip.timecode}
                                >
                                  {formatCardDuration(clip.durationSeconds)}
                                </span>
                              </div>
                            ))
                          ) : (
                            <p className="px-3 py-4 text-xs text-custom-text-300">
                              No saved tags are available for this playlist.
                            </p>
                          )}
                        </CreateCardScrollArea>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-custom-border-200 px-5 py-3">
          <div className="min-w-0 flex-1 text-[11px] text-custom-text-300">
            <p>
              {selectedPlayers.length
                ? `Recipients: ${selectedPlayers.map(formatCardPlayer).join(", ")}`
                : "Choose players from the roster."}
            </p>
            {!onSubmit && (
              <p id="create-card-submit-status" className="mt-1">
                Saving and sending cards is not available yet.
              </p>
            )}
            {submitError && (
              <p role="alert" className="mt-1 text-red-500">
                {submitError}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="rounded-lg border border-custom-border-300 px-3 py-2 text-sm text-custom-text-100 hover:bg-custom-background-90 disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              aria-describedby={!onSubmit ? "create-card-submit-status" : undefined}
              className="inline-flex items-center gap-2 rounded-lg bg-custom-primary-100 px-3 py-2 text-sm font-medium text-white hover:bg-custom-primary-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <PanelsTopLeft className="h-3.5 w-3.5" />
              {isSubmitting
                ? "Sending…"
                : selectedPlayers.length
                  ? `Save & Send to ${selectedPlayers.length} Player${selectedPlayers.length === 1 ? "" : "s"}`
                  : "Save & Send"}
            </button>
          </div>
        </div>
      </form>
    </ModalCore>
  );
};
