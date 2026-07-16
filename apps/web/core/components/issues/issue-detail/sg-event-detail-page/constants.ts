import type { RowFilterMode, SportTableConfig, SportTableKind } from "./types";

export const SG_PLAYER_STYLE = `
  .sg-event-player .video-js {
    width: 100%;
    height: 100%;
    background: #0f1014;
    border-radius: 5px;
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
    gap: 4px;
    height: 78px;
    padding: 34px 12px 8px;
    background: rgba(12, 12, 12, 0.78);
    inset-inline: 0;
    bottom: 0;
  }
  .sg-event-player .video-js .vjs-control,
  .sg-event-player .video-js .vjs-time-control {
    color: #ffffff;
    font-size: 11px;
  }
  .sg-event-player .video-js .vjs-button {
    width: 24px;
    min-width: 24px;
    height: 26px;
    padding: 0;
  }
  .sg-event-player .video-js .vjs-button > .vjs-icon-placeholder:before {
    font-size: 15px;
    line-height: 26px;
  }
  .sg-event-player .video-js .vjs-current-time,
  .sg-event-player .video-js .vjs-duration {
    display: block;
    min-width: auto;
    width: auto;
    height: 26px;
    padding: 0;
    line-height: 26px;
    order: 1;
  }
  .sg-event-player .video-js .vjs-current-time {
    margin-right: 1px;
  }
  .sg-event-player .video-js .vjs-duration {
    margin-left: 0;
  }
  .sg-event-player .video-js .vjs-duration:before {
    content: "/";
    padding: 0 2px;
  }
  .sg-event-player .video-js .vjs-progress-control {
    position: absolute;
    inset: 23px 12px auto 12px;
    width: auto;
    height: 12px;
    padding: 0;
    margin: 0;
    display: block;
    order: 0;
  }
  .sg-event-player .video-js .vjs-progress-holder,
  .sg-event-player .video-js .vjs-volume-bar {
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.18);
  }
  .sg-event-player .video-js .vjs-slider-horizontal {
    height: 3px;
  }
  .sg-event-player .video-js .vjs-progress-control .vjs-progress-holder {
    height: 3px;
    margin: 4px 0;
    background: rgba(255, 255, 255, 0.72);
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
  .sg-event-player .video-js .vjs-volume-panel {
    order: 2;
    width: 28px;
    height: 26px;
    margin-left: 4px;
  }
  .sg-event-player .video-js .vjs-volume-panel .vjs-volume-control {
    display: none;
  }
  .sg-event-player .video-js .vjs-previous-button,
  .sg-event-player .video-js .vjs-skip-backward-button,
  .sg-event-player .video-js .vjs-play-control,
  .sg-event-player .video-js .vjs-skip-forward-button,
  .sg-event-player .video-js .vjs-next-button {
    position: absolute;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    left: 50%;
    bottom: 8px;
    margin: 0;
  }
  .sg-event-player .video-js .vjs-previous-button .vjs-icon-placeholder,
  .sg-event-player .video-js .vjs-skip-backward-button .vjs-icon-placeholder,
  .sg-event-player .video-js .vjs-play-control .vjs-icon-placeholder,
  .sg-event-player .video-js .vjs-skip-forward-button .vjs-icon-placeholder,
  .sg-event-player .video-js .vjs-next-button .vjs-icon-placeholder {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
  }
  .sg-event-player .video-js .vjs-play-control .vjs-icon-placeholder:before {
    position: static;
    width: auto;
    height: auto;
  }
  .sg-event-player .video-js .vjs-previous-button {
    transform: translateX(calc(-50% - 48px));
  }
  .sg-event-player .video-js .vjs-skip-backward-button {
    transform: translateX(calc(-50% - 24px));
  }
  .sg-event-player .video-js .vjs-play-control {
    transform: translateX(-50%);
  }
  .sg-event-player .video-js .vjs-skip-forward-button {
    transform: translateX(calc(-50% + 24px));
  }
  .sg-event-player .video-js .vjs-next-button {
    transform: translateX(calc(-50% + 48px));
  }
  .sg-event-player .video-js .vjs-subs-caps-button,
  .sg-event-player .video-js .vjs-loop-button,
  .sg-event-player .video-js .vjs-picture-in-picture-control,
  .sg-event-player .video-js .vjs-fullscreen-control,
  .sg-event-player .video-js .vjs-settings-button {
    position: relative;
    bottom: auto;
    margin: 0;
    order: 20;
  }
  .sg-event-player .video-js .vjs-loop-button {
    margin-left: auto;
  }
  .sg-event-player .video-js .vjs-subs-caps-button {
    margin-left: 4px;
  }
  .sg-event-player .video-js .vjs-picture-in-picture-control {
    margin-left: 4px;
  }
  .sg-event-player .video-js .vjs-fullscreen-control {
    margin-left: 4px;
  }
  .sg-event-player .video-js .vjs-settings-button {
    margin-left: 4px;
  }
  .sg-event-player .video-js .vjs-skip-backward-button .vjs-icon-placeholder:before,
  .sg-event-player .video-js .vjs-skip-forward-button .vjs-icon-placeholder:before,
  .sg-event-player .video-js .vjs-previous-button .vjs-icon-placeholder:before,
  .sg-event-player .video-js .vjs-next-button .vjs-icon-placeholder:before,
  .sg-event-player .video-js .vjs-loop-button .vjs-icon-placeholder:before,
  .sg-event-player .video-js .vjs-settings-button .vjs-icon-placeholder:before {
    content: "";
  }
  .sg-event-player .video-js .vjs-skip-backward-button .vjs-icon-placeholder,
  .sg-event-player .video-js .vjs-skip-forward-button .vjs-icon-placeholder,
  .sg-event-player .video-js .vjs-previous-button .vjs-icon-placeholder,
  .sg-event-player .video-js .vjs-next-button .vjs-icon-placeholder,
  .sg-event-player .video-js .vjs-loop-button .vjs-icon-placeholder,
  .sg-event-player .video-js .vjs-settings-button .vjs-icon-placeholder {
    display: block;
    width: 13px;
    height: 13px;
    background-position: center;
    background-repeat: no-repeat;
    background-size: contain;
  }
  .sg-event-player .video-js .vjs-previous-button .vjs-icon-placeholder {
    background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='11' height='12' viewBox='0 0 11 12' fill='none'><path d='M9.5 10.75L3.25 5.75L9.5 0.75V10.75Z' stroke='%23E5E7EB' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/><path d='M0.75 10.125V1.375' stroke='%23E5E7EB' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/></svg>");
  }
  .sg-event-player .video-js .vjs-skip-backward-button .vjs-icon-placeholder {
    background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'><path d='m11 17-5-5 5-5'/><path d='m18 17-5-5 5-5'/></svg>");
  }
  .sg-event-player .video-js .vjs-skip-forward-button .vjs-icon-placeholder {
    background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'><path d='m13 17 5-5-5-5'/><path d='m6 17 5-5-5-5'/></svg>");
  }
  .sg-event-player .video-js .vjs-next-button .vjs-icon-placeholder {
    background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='11' height='12' viewBox='0 0 11 12' fill='none'><path d='M1.5 10.75L7.75 5.75L1.5 0.75V10.75Z' stroke='%23E5E7EB' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/><path d='M10.25 10.125V1.375' stroke='%23E5E7EB' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/></svg>");
  }
  .sg-event-player .video-js .vjs-loop-button .vjs-icon-placeholder {
    opacity: 0.58;
    background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'><path d='M17 2l4 4-4 4'/><path d='M3 11V9a3 3 0 0 1 3-3h15'/><path d='M7 22l-4-4 4-4'/><path d='M21 13v2a3 3 0 0 1-3 3H3'/></svg>");
  }
  .sg-event-player .video-js .vjs-loop-button.vjs-control-active .vjs-icon-placeholder {
    opacity: 1;
  }
  .sg-event-player .video-js .vjs-settings-button .vjs-icon-placeholder {
    background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round'><circle cx='12' cy='12' r='3'/><path d='M19.4 15a1.7 1.7 0 0 0 .34 1.87l.09.09a2.1 2.1 0 1 1-2.97 2.97l-.09-.09A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 1.55V21a2.1 2.1 0 1 1-4.2 0v-.05a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.83.44l-.09.09a2.1 2.1 0 1 1-2.97-2.97l.09-.09A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.55-1H3a2.1 2.1 0 1 1 0-4.2h.05A1.7 1.7 0 0 0 4.6 8a1.7 1.7 0 0 0-.44-1.83l-.09-.09A2.1 2.1 0 1 1 6.99 3.1l.09.09A1.7 1.7 0 0 0 8.9 3.6a1.7 1.7 0 0 0 1-1.55V2a2.1 2.1 0 1 1 4.2 0v.05a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.83-.44l.09-.09A2.1 2.1 0 1 1 20.9 6.08l-.09.09A1.7 1.7 0 0 0 19.4 8c0 .7.42 1.34 1.05 1.55H21a2.1 2.1 0 1 1 0 4.2h-.05A1.7 1.7 0 0 0 19.4 15Z'/></svg>");
  }
`;

export const SURFACE_CLASS = "rounded-lg border border-custom-border-200 bg-custom-background-100";

export const ICON_BUTTON_CLASS =
  "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-custom-border-200 bg-custom-background-100 text-custom-text-300 transition-colors hover:bg-custom-background-90 hover:text-custom-text-100";

export const PLAYER_FRAME_CLASS = "h-[clamp(260px,42vw,505px)] w-full";

export const PLAYER_STAGE_CLASS = "mx-auto h-full w-full max-w-full overflow-hidden rounded-[5px]";

export const TAG_TABLE_GRID_CLASS =
  "grid-cols-[56px_minmax(120px,150px)_minmax(96px,0.7fr)_minmax(150px,1.15fr)_minmax(110px,0.8fr)_minmax(150px,1fr)_minmax(130px,0.9fr)_minmax(120px,0.8fr)_96px]";

export const FOOTBALL_TAG_TABLE_GRID_CLASS =
  "grid-cols-[56px_minmax(120px,150px)_minmax(96px,0.7fr)_minmax(150px,1.15fr)_minmax(110px,0.8fr)_minmax(150px,1fr)_minmax(130px,0.9fr)_minmax(120px,0.8fr)_96px]";

export const SPORT_TABLE_CONFIGS: Record<SportTableKind, SportTableConfig> = {
  "american-football": {
    actionLabel: "Primary Action",
    defaultGroupValue: "Quarter 1",
    groupByLabel: "Quarter",
    isCompactFootballTable: true,
    playerLabel: "Players",
    primaryDetailLabel: "Yard",
    secondaryDetailLabel: "",
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
    primaryDetailLabel: "Game Clock",
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
