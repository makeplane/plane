import type { RowFilterMode, SportTableConfig, SportTableKind } from "./types";

export const SG_PLAYER_STYLE = `
  .sg-event-player .video-js {
    width: 100%;
    height: 100%;
    background: #0f1014;
    border-radius: 10px;
    overflow: hidden;
  }
  .sg-event-player .video-js .vjs-tech {
    object-fit: contain;
    background: #05060a;
  }
  .sg-event-player .video-js .vjs-big-play-button {
    display: none;
  }
  .sg-event-player .video-js .vjs-control-bar {
    display: flex;
    align-items: center;
    gap: 6px;
    height: 48px;
    padding: 0 12px;
    background: linear-gradient(180deg, rgba(12, 13, 17, 0) 0%, rgba(12, 13, 17, 0.78) 55%, rgba(12, 13, 17, 0.94) 100%);
    inset-inline: 0;
    bottom: 0;
  }
  .sg-event-player .video-js .vjs-control,
  .sg-event-player .video-js .vjs-time-control {
    color: #ffffff;
    font-size: 11px;
  }
  .sg-event-player .video-js .vjs-current-time,
  .sg-event-player .video-js .vjs-duration {
    min-width: 52px;
  }
  .sg-event-player .video-js .vjs-progress-control {
    flex: 1;
  }
  .sg-event-player .video-js .vjs-progress-holder,
  .sg-event-player .video-js .vjs-volume-bar {
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.18);
  }
  .sg-event-player .video-js .vjs-slider-horizontal {
    height: 4px;
  }
  .sg-event-player .video-js .vjs-play-progress,
  .sg-event-player .video-js .vjs-volume-level {
    border-radius: 999px;
    background: #ffffff;
  }
  .sg-event-player .video-js .vjs-play-progress:before,
  .sg-event-player .video-js .vjs-volume-level:before {
    display: none;
  }
  .sg-event-player .video-js .vjs-skip-backward-button .vjs-icon-placeholder:before,
  .sg-event-player .video-js .vjs-skip-forward-button .vjs-icon-placeholder:before,
  .sg-event-player .video-js .vjs-settings-button .vjs-icon-placeholder:before {
    content: "";
  }
  .sg-event-player .video-js .vjs-skip-backward-button .vjs-icon-placeholder,
  .sg-event-player .video-js .vjs-skip-forward-button .vjs-icon-placeholder,
  .sg-event-player .video-js .vjs-settings-button .vjs-icon-placeholder {
    display: block;
    width: 16px;
    height: 16px;
    background-position: center;
    background-repeat: no-repeat;
    background-size: contain;
  }
  .sg-event-player .video-js .vjs-skip-backward-button .vjs-icon-placeholder {
    background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'><path d='m11 17-5-5 5-5'/><path d='m18 17-5-5 5-5'/></svg>");
  }
  .sg-event-player .video-js .vjs-skip-forward-button .vjs-icon-placeholder {
    background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'><path d='m13 17 5-5-5-5'/><path d='m6 17 5-5-5-5'/></svg>");
  }
  .sg-event-player .video-js .vjs-settings-button .vjs-icon-placeholder {
    background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round'><circle cx='12' cy='12' r='3'/><path d='M19.4 15a1.7 1.7 0 0 0 .34 1.87l.09.09a2.1 2.1 0 1 1-2.97 2.97l-.09-.09A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 1.55V21a2.1 2.1 0 1 1-4.2 0v-.05a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.83.44l-.09.09a2.1 2.1 0 1 1-2.97-2.97l.09-.09A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.55-1H3a2.1 2.1 0 1 1 0-4.2h.05A1.7 1.7 0 0 0 4.6 8a1.7 1.7 0 0 0-.44-1.83l-.09-.09A2.1 2.1 0 1 1 6.99 3.1l.09.09A1.7 1.7 0 0 0 8.9 3.6a1.7 1.7 0 0 0 1-1.55V2a2.1 2.1 0 1 1 4.2 0v.05a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.83-.44l.09-.09A2.1 2.1 0 1 1 20.9 6.08l-.09.09A1.7 1.7 0 0 0 19.4 8c0 .7.42 1.34 1.05 1.55H21a2.1 2.1 0 1 1 0 4.2h-.05A1.7 1.7 0 0 0 19.4 15Z'/></svg>");
  }
`;

export const SURFACE_CLASS = "rounded-xl border border-custom-border-200 ";

export const ICON_BUTTON_CLASS =
  "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-custom-border-200 bg-custom-background-100 text-custom-text-300 transition-colors hover:bg-custom-background-90 hover:text-custom-text-100";

export const PLAYER_FRAME_CLASS =
  "h-[clamp(220px,38vh,420px)] sm:h-[clamp(260px,42vh,500px)] xl:h-[min(44vh,32rem)]";

export const PLAYER_STAGE_CLASS =
  "mx-auto h-full w-full max-w-full overflow-hidden rounded-xl xl:w-auto xl:aspect-video";

export const TAG_TABLE_GRID_CLASS =
  "grid-cols-[64px_minmax(110px,0.95fr)_minmax(130px,1.05fr)_minmax(90px,0.8fr)_minmax(145px,1.15fr)_minmax(120px,0.95fr)_minmax(130px,1fr)_minmax(100px,0.8fr)_104px]";

export const SPORT_TABLE_CONFIGS: Record<SportTableKind, SportTableConfig> = {
  "american-football": {
    actionLabel: "Play",
    defaultGroupValue: "Quarter 1",
    groupByLabel: "Quarter",
    primaryDetailLabel: "Down & Distance",
    secondaryDetailLabel: "Yards",
    sport: "american-football",
  },
  baseball: {
    actionLabel: "Action",
    defaultGroupValue: "Top 1st",
    groupByLabel: "Inning",
    primaryDetailLabel: "Inning",
    secondaryDetailLabel: "Count",
    sport: "baseball",
  },
  soccer: {
    actionLabel: "Action",
    defaultGroupValue: "All tags",
    groupByLabel: "Period",
    primaryDetailLabel: "Match Time",
    secondaryDetailLabel: "Zone",
    sport: "soccer",
  },
  basketball: {
    actionLabel: "Action",
    defaultGroupValue: "Q1",
    groupByLabel: "Quarter",
    primaryDetailLabel: "Quarter",
    secondaryDetailLabel: "Value",
    sport: "basketball",
  },
  cricket: {
    actionLabel: "Action",
    defaultGroupValue: "Over 0",
    groupByLabel: "Over",
    primaryDetailLabel: "Over",
    secondaryDetailLabel: "Runs",
    sport: "cricket",
  },
  default: {
    actionLabel: "Action",
    defaultGroupValue: "All tags",
    groupByLabel: "Group",
    primaryDetailLabel: "Phase",
    secondaryDetailLabel: "Value",
    sport: "default",
  },
};

export const ROW_FILTER_LABELS: Record<RowFilterMode, string> = {
  all: "All rows",
  favorites: "Favorites only",
  selected: "Selected rows",
};
