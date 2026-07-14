import type { TIssue } from "@plane/types";
import type { TMediaArtifact } from "@/services/media-library.service";
import type { TMediaItem } from "ce/features/media-library/types/media-library.types";
import type { TEventMediaDetails } from "ce/features/media-library/utils/media-event";

export type SportTableKind = "american-football" | "baseball" | "soccer" | "basketball" | "cricket" | "default";

export type SportTableConfig = {
  actionLabel: string;
  defaultGroupValue: string;
  groupByLabel: string;
  isCompactFootballTable?: boolean;
  playerLabel?: string;
  primaryDetailLabel: string;
  secondaryDetailLabel: string;
  sport: SportTableKind;
};

export type SgIssue = TIssue & { sg_event_id?: string | number | null };

export type SgEventDetailPageProps = {
  enableMatrixView?: boolean;
  projectId: string;
  workspaceSlug: string;
  issue?: TIssue;
  mediaItem?: TMediaItem | null;
  fallbackBackHref?: string;
  onBack?: () => void;
};

export type SgTagRow = {
  action: string;
  clipId: string | null;
  clipEndSeconds: number | null;
  clipStartSeconds: number | null;
  context: Readonly<Record<string, string>>;
  groupValue: string;
  id: string;
  matrixParticipant: string | null;
  matrixPeriod: string | null;
  player: string;
  playlistFallbackTimestamp: string | null;
  playlistTimestamp: string | null;
  primaryDetail: string;
  result: string;
  secondaryDetail: string;
  sourceTagId: string | null;
  sourceUrl: string;
  team: string;
  thumbnailUrl: string;
  timecode: string;
};

export type SgEventDevice = {
  hlsUrl: string | null;
  id: number;
  name: string;
  streamName: string;
};

export type SgEventPayloadLoadStatus = "loaded" | "unavailable" | "error";

export type SgEventPayloadLoadResult = {
  eventPayload: Record<string, unknown> | null;
  eventPayloadErrorMessage: string | null;
  eventPayloadStatus: SgEventPayloadLoadStatus;
};

export type SgMediaPayload = SgEventPayloadLoadResult & {
  eventDetails: TEventMediaDetails | null;
  eventItem: TMediaItem | null;
  mediaItems: TMediaItem[];
  manifestArtifacts: TMediaArtifact[];
  packageId: string;
  videoItems: TMediaItem[];
};

export type RowFilterMode = "all" | "selected" | "favorites";

export type SgEventTagViewMode = "list" | "timeline" | "matrix";
