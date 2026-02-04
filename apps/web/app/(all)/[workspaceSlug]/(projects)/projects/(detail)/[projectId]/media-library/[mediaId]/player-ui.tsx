"use client";

import type { RefObject } from "react";
import { useState } from "react";
import { ChevronDown, Pause, Play } from "lucide-react";

type TOverlayProps = {
  isPlaying: boolean;
  onToggle: () => void;
  onSeek: (delta: number) => void;
};

const SkipIcon = ({ direction }: { direction: "back" | "forward" }) => (
  <span className="player-skip-icon" aria-hidden="true">
    {direction === "forward" ? (
      <svg viewBox="0 0 24 24" className="player-skip-icon__svg" fill="none">
        <path d="M13.98 4.46997L12 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path
          d="M19.0899 7.79999C20.1999 9.27999 20.8899 11.11 20.8899 13.11C20.8899 18.02 16.9099 22 11.9999 22C7.08988 22 3.10986 18.02 3.10986 13.11C3.10986 8.19999 7.08988 4.21997 11.9999 4.21997C12.6799 4.21997 13.3399 4.31002 13.9799 4.46002"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M13.91 10.8301H10.85L10.0901 13.1201H12.3801C13.2201 13.1201 13.91 13.8001 13.91 14.6501C13.91 15.4901 13.2301 16.1801 12.3801 16.1801H10.0901"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ) : (
      <svg viewBox="0 0 24 24" className="player-skip-icon__svg" fill="none">
        <path
          d="M13.91 10.8301H10.85L10.09 13.1201H12.38C13.22 13.1201 13.91 13.8001 13.91 14.6501C13.91 15.4901 13.23 16.1801 12.38 16.1801H10.09"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M10.02 4.46997L12 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path
          d="M4.91 7.79999C3.8 9.27999 3.10999 11.11 3.10999 13.11C3.10999 18.02 7.09 22 12 22C16.91 22 20.89 18.02 20.89 13.11C20.89 8.19999 16.91 4.21997 12 4.21997C11.32 4.21997 10.66 4.31002 10.02 4.46002"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )}
  </span>
);

export const PlayerOverlay = ({ isPlaying, onToggle, onSeek }: TOverlayProps) => (
  <div className="player-overlay-controls is-visible">
    <div className="player-overlay-box">
      <button
        type="button"
        className="player-overlay-button"
        onClick={() => onSeek(-5)}
        aria-label="Skip back 5 seconds"
      >
        <SkipIcon direction="back" />
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
        <SkipIcon direction="forward" />
      </button>
    </div>
  </div>
);

export type TQualityOption = {
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
