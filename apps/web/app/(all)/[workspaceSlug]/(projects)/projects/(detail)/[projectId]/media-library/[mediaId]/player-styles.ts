export const PLAYER_STYLE = `
                  .media-player {
                    position: relative;
                    isolation: isolate;
                  }
                  .media-player .video-js {
                    position: relative;
                    z-index: 1;
                  }
                  .media-player .video-js .vjs-control-bar {
                    display: flex;
                    align-items: center;
                    flex-wrap: nowrap;
                    background: rgba(0, 0, 0, 0.65);
                    border-radius: 0 0 12px 12px;
                    height: 30px;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    padding: 0 12px;
                    box-shadow: 0 12px 26px rgba(0, 0, 0, 0.35);
                    gap: 8px;
                  }
                  .media-player .video-js .vjs-control {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                  }
                  .media-player .video-js .vjs-control-bar,
                  .media-player .video-js .vjs-time-control {
                    color: #f9fafb;
                    font-size: 12px;
                    font-weight: 400;
                    line-height: 1;
                  }
                  .media-player .video-js .vjs-time-control {
                    min-width: 40px;
                    padding: 0 2px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                  }
                  .media-player .video-js .vjs-time-divider {
                    padding: 0 2px;
                  }
                  .media-player .video-js .vjs-progress-control {
                    flex: 1;
                    margin: 0 12px 0 6px;
                    display: flex;
                    align-items: center;
                    min-width: 0;
                  }
                  .media-player .video-js .vjs-progress-control .vjs-progress-holder {
                    width: 100%;
                  }
                  .media-player .video-js .vjs-time-control {
                    flex: 0 0 auto;
                    white-space: nowrap;
                  }
                  .media-player .video-js .vjs-progress-holder {
                    height: 4px;
                    border-radius: 999px;
                    background: rgba(255, 255, 255, 0.2);
                    margin: 0;
                  }
                  .media-player .video-js .vjs-load-progress {
                    background: rgba(255, 255, 255, 0.35);
                    border-radius: 999px;
                  }
                  .media-player .video-js .vjs-play-progress {
                    background: #ffffff;
                    border-radius: 999px;
                  }
                  .media-player .video-js .vjs-progress-holder .vjs-play-progress:before {
                    border-radius: 999px;
                    height: 4px;
                    width: 4px;
                    top: 0;
                    transform: none;
                  }
                  .media-player .video-js .vjs-button {
                    width: 26px;
                    height: 24px;
                  }
                  .media-player .video-js .vjs-button .vjs-icon-placeholder:before {
                    font-size: 1.1em;
                  }
                  .media-player .video-js .vjs-volume-panel {
                    margin-left: 6px;
                    flex: 0 0 auto;
                  }
                  .media-player .video-js .vjs-volume-panel .vjs-volume-control {
                    display: flex;
                    align-items: center;
                    width: 36px;
                    margin-left: 4px;
                  }
                  .media-player .video-js .vjs-volume-bar {
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 999px;
                    height: 3px;
                  }
                  .media-player .video-js .vjs-volume-level {
                    background: #ffffff;
                    border-radius: 999px;
                  }
                  .media-player .video-js .vjs-control .vjs-icon-placeholder {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                  }
                  .media-player .video-js .vjs-quality-selector,
                  .media-player .video-js .vjs-hls-quality-selector,
                  .media-player .video-js .vjs-quality-menu,
                  .media-player .video-js .vjs-menu-button.vjs-icon-cog {
                    display: none !important;
                  }
                  .media-player .video-js .vjs-live-control,
                  .media-player .video-js .vjs-live-display,
                  .media-player .video-js .vjs-live,
                  .media-player .video-js .vjs-live-button {
                    display: none !important;
                  }
                  .media-player .video-js .vjs-control-bar [class*="live"] {
                    display: none !important;
                  }
                  .media-player .video-js .vjs-play-control,
                  .media-player .video-js .vjs-replay-control,
                  .media-player .video-js .vjs-skip-backward,
                  .media-player .video-js .vjs-skip-forward,
                  .media-player .video-js .vjs-prev-control,
                  .media-player .video-js .vjs-next-control,
                  .media-player .video-js .vjs-playback-rate,
                  .media-player .video-js .vjs-subs-caps-button,
                  .media-player .video-js .vjs-remaining-time,
                  .media-player .video-js .vjs-picture-in-picture-control {
                    display: none !important;
                  }
                  .media-player .video-js .vjs-big-play-button {
                    display: none;
                  }
                  .media-player .video-js .vjs-overflow-button .vjs-icon-placeholder:before {
                    content: "";
                  }
                  .media-player .video-js .vjs-overflow-button .vjs-icon-placeholder {
                    position: relative;
                    width: 16px;
                    height: 16px;
                    display: block;
                    opacity: 1;
                    background: no-repeat center / contain;
                    background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'><circle cx='12' cy='12' r='3.2'/><path d='M19.4 15a1.7 1.7 0 0 0 .34 1.87l.09.09a2.1 2.1 0 1 1-2.97 2.97l-.09-.09A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 1.55V21a2.1 2.1 0 1 1-4.2 0v-.05a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.83.44l-.09.09a2.1 2.1 0 1 1-2.97-2.97l.09-.09A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.55-1H3a2.1 2.1 0 1 1 0-4.2h.05A1.7 1.7 0 0 0 4.6 8a1.7 1.7 0 0 0-.44-1.83l-.09-.09A2.1 2.1 0 1 1 6.99 3.1l.09.09A1.7 1.7 0 0 0 8.9 3.6a1.7 1.7 0 0 0 1-1.55V2a2.1 2.1 0 1 1 4.2 0v.05a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.83-.44l.09-.09A2.1 2.1 0 1 1 20.9 6.08l-.09.09A1.7 1.7 0 0 0 19.4 8c0 .7.42 1.34 1.05 1.55H21a2.1 2.1 0 1 1 0 4.2h-.05A1.7 1.7 0 0 0 19.4 15Z'/></svg>");
                  }
                  .media-player .video-js .vjs-overflow-button .vjs-icon-placeholder:after {
                    content: none;
                  }
                  .media-player .video-js .vjs-overflow-button {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 26px;
                  }
                  .media-player .video-js .vjs-pip-toggle .vjs-icon-placeholder:before {
                    content: "";
                  }
                  .media-player .video-js .vjs-pip-toggle .vjs-icon-placeholder {
                    position: relative;
                    width: 16px;
                    height: 16px;
                    display: block !important;
                    opacity: 1 !important;
                    background: no-repeat center / contain;
                    background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'><path d='M21 15V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h6'/><path d='M21 15h-6a2 2 0 0 0-2 2v4h8z'/></svg>");
                  }
                  .media-player .video-js .vjs-pip-toggle .vjs-icon-placeholder:after {
                    content: none;
                  }
                  .media-player .video-js .vjs-pip-toggle {
                    display: flex !important;
                    align-items: center;
                    justify-content: center;
                    width: 26px;
                  }
                  .media-player .video-js .vjs-overflow-button {
                    display: flex !important;
                  }
                  .media-player .video-js .vjs-pip-toggle,
                  .media-player .video-js .vjs-overflow-button {
                    visibility: visible !important;
                    opacity: 1 !important;
                  }
                  .media-player .video-js .vjs-pip-toggle .vjs-icon-placeholder {
                    display: block !important;
                  }
                  .media-player .video-js .vjs-volume-panel,
                  .media-player .video-js .vjs-pip-toggle,
                  .media-player .video-js .vjs-fullscreen-control,
                  .media-player .video-js .vjs-overflow-button {
                    margin-left: 2px;
                  }
                  .media-player .video-js .vjs-overflow-button {
                    margin-left: 6px;
                  }
                  .media-player .player-overlay-controls {
                    position: absolute;
                    left: 0;
                    right: 0;
                    top: 50%;
                    transform: translateY(-50%);
                    display: flex !important;
                    align-items: center;
                    justify-content: center;
                    gap: 18px;
                    pointer-events: none;
                    opacity: 0;
                    visibility: hidden;
                    z-index: 5;
                    transition: opacity 160ms ease, visibility 160ms ease;
                  }
                  .media-player:hover .player-overlay-controls,
                  .media-player:focus-within .player-overlay-controls {
                    opacity: 1;
                    visibility: visible;
                  }
                  .media-player .player-overlay-box {
                    pointer-events: auto;
                    display: inline-flex;
                    align-items: center;
                    gap: 18px;
                    padding: 10px 18px;
                    border-radius: 12px;
                  }
                  .media-player .player-overlay-button {
                    pointer-events: auto;
                    height: 44px;
                    width: 44px;
                    border-radius: 999px;
                    background: rgba(0, 0, 0, 0.55);
                    border: none;
                    color: #ffffff;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    transition: transform 160ms ease, background 160ms ease;
                  }
                  .media-player .player-overlay-button--primary {
                    height: 56px;
                    width: 56px;
                    background: rgba(0, 0, 0, 0.65);
                  }
                  .media-player .player-overlay-icon {
                    height: 22px;
                    width: 22px;
                  }
                  .media-player .player-overlay-button--primary .player-overlay-icon {
                    height: 26px;
                    width: 26px;
                  }
                  .media-player .player-overlay-icon--back {
                    transform: rotate(180deg);
                  }
                  .media-player .player-overlay-button:hover {
                    transform: scale(1.04);
                    background: rgba(0, 0, 0, 0.8);
                  }
                  .media-player .player-settings-panel {
                    position: absolute;
                    right: 18px;
                    bottom: 52px;
                    width: 260px;
                    background: rgba(20, 20, 20, 0.95);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 10px;
                    box-shadow: 0 16px 32px rgba(0, 0, 0, 0.4);
                    color: #f9fafb;
                    z-index: 6;
                    padding: 8px 12px;
                  }
                  .media-player .player-settings-row {
                    width: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 10px;
                    padding: 8px 0;
                    font-size: 12px;
                    font-weight: 500;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                    background: transparent;
                    color: inherit;
                    cursor: pointer;
                  }
                  .media-player .player-settings-row:last-child {
                    border-bottom: none;
                  }
                  .media-player .player-settings-value {
                    margin-left: auto;
                    color: #4fc3ff;
                    font-weight: 500;
                  }
                  .media-player .player-settings-chevron {
                    color: #4fc3ff;
                    font-size: 12px;
                  }
                  .media-player .player-settings-dropdown {
                    margin: 6px 0 10px;
                    padding: 8px 0;
                    background: rgba(18, 18, 18, 0.98);
                    border-radius: 10px;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                  }
                  .media-player .player-settings-dropdown-item {
                    width: 100%;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 12px;
                    background: transparent;
                    border: none;
                    color: #4fc3ff;
                    font-size: 12px;
                    text-align: left;
                    cursor: pointer;
                  }
                  .media-player .player-settings-dropdown-item.is-active {
                    color: #ffffff;
                  }
                  .media-player .player-settings-check {
                    width: 14px;
                    color: #ffffff;
                    opacity: 0;
                  }
                  .media-player .player-settings-dropdown-item.is-active .player-settings-check {
                    opacity: 1;
                  }
`;
