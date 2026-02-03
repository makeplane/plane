"use client";

import type { RefObject } from "react";
import { useState } from "react";
import { ChevronDown, Pause, Play } from "lucide-react";

type TOverlayProps = {
  isPlaying: boolean;
  onToggle: () => void;
  onSeek: (delta: number) => void;
};

export const PlayerOverlay = ({ isPlaying, onToggle, onSeek }: TOverlayProps) => (
  <div className="player-overlay-controls is-visible">
    <div className="player-overlay-box">
      <button
        type="button"
        className="player-overlay-button"
        onClick={() => onSeek(-5)}
        aria-label="Skip back 5 seconds"
      >
        <Play className="player-overlay-icon player-overlay-icon--back" aria-hidden="true" />
      </button>
      <button
        type="button"
        className="player-overlay-button player-overlay-button--primary"
        onClick={onToggle}
        aria-label={isPlaying ? "Pause video" : "Play video"}
      >
        {isPlaying ? (
          <Pause className="player-overlay-icon" aria-hidden="true" />
        ) : (
          <Play className="player-overlay-icon" aria-hidden="true" />
        )}
      </button>
      <button
        type="button"
        className="player-overlay-button"
        onClick={() => onSeek(5)}
        aria-label="Skip forward 5 seconds"
      >
        <Play className="player-overlay-icon" aria-hidden="true" />
      </button>
    </div>
  </div>
);

type TQualityOption = {
  key: string;
  label: string;
  isAuto: boolean;
  selected: boolean;
  rep: any;
  disabled?: boolean;
};

type TSettingsPanelProps = {
  isOpen: boolean;
  onClose: () => void;
  qualityOptions: TQualityOption[];
  playbackRates: number[];
  currentPlaybackRate: number;
  onSelectQuality: (option: TQualityOption) => void;
  onSelectRate: (rate: number) => void;
  panelRef: RefObject<HTMLDivElement>;
};

export const PlayerSettingsPanel = ({
  isOpen,
  onClose,
  qualityOptions,
  playbackRates,
  currentPlaybackRate,
  onSelectQuality,
  onSelectRate,
  panelRef,
}: TSettingsPanelProps) => {
  const [openSection, setOpenSection] = useState<"quality" | "speed" | null>(null);

  if (!isOpen) return null;

  const hasRealQualityOption = qualityOptions.some((option) => !option.disabled && !option.isAuto);
  const showQualityRow = openSection !== "speed" && hasRealQualityOption;
  const showSpeedRow = openSection !== "quality";

  return (
    <div ref={panelRef} className="player-settings-panel" role="dialog" aria-label="Settings">
      {showQualityRow ? (
        <>
          <button
            type="button"
            className="player-settings-row"
            onClick={() => setOpenSection((prev) => (prev === "quality" ? null : "quality"))}
          >
            <span>Video Quality</span>
            <span className="player-settings-value">
              {qualityOptions.find((option) => option.selected)?.label ?? "Auto"}
            </span>
            <ChevronDown className="player-settings-chevron" aria-hidden="true" />
          </button>
          {openSection === "quality" ? (
            <div className="player-settings-dropdown">
              {qualityOptions.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  className={`player-settings-dropdown-item ${option.selected ? "is-active" : ""} ${
                    option.disabled ? "is-disabled" : ""
                  }`}
                  onClick={() => {
                    onSelectQuality(option);
                    setOpenSection("quality");
                  }}
                  disabled={option.disabled}
                  aria-disabled={option.disabled}
                >
                  <span className="player-settings-check">✓</span>
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          ) : null}             
        </>
      ) : null}
      {showSpeedRow ? (
        <>
          <button
            type="button"
            className="player-settings-row"
            onClick={() => setOpenSection((prev) => (prev === "speed" ? null : "speed"))}
          >
            <span>Speed</span>
            <span className="player-settings-value">
              {currentPlaybackRate === 1 ? "Normal" : `${currentPlaybackRate}x`}
            </span>
            <ChevronDown className="player-settings-chevron" aria-hidden="true" />
          </button>
          {openSection === "speed" ? (
            <div className="player-settings-dropdown">
              {playbackRates.map((rate) => (
                <button
                  key={rate}
                  type="button"
                  className={`player-settings-dropdown-item ${currentPlaybackRate === rate ? "is-active" : ""}`}
                  onClick={() => {
                    onSelectRate(rate);
                    setOpenSection("speed");
                  }}
                >
                  <span className="player-settings-check">✓</span>
                  <span>{rate === 1 ? "Normal" : `${rate}x`}</span>
                </button>
              ))}
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
};
