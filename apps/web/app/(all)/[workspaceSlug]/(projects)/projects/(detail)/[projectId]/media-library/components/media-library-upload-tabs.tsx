"use client";

import type { TUploadTarget } from "./media-library-upload-types";

type Props = {
  value: TUploadTarget;
  onChange: (value: TUploadTarget) => void;
};

const TAB_OPTIONS: Array<{ key: TUploadTarget; label: string; helper: string }> = [
  {
    key: "library",
    label: "Upload to library",
    helper: "Upload files to the project media library.",
  },
  {
    key: "work-item",
    label: "Add media to work item",
    helper: "Link uploaded media to a work item in this project.",
  },
];

export const MediaLibraryUploadTabs = ({ value, onChange }: Props) => (
  <div className="mb-4">
    <div
      role="tablist"
      aria-label="Upload options"
      className="flex items-center gap-1 rounded-lg border border-custom-border-200 bg-custom-background-90 p-1"
    >
      {TAB_OPTIONS.map((tab) => {
        const isActive = value === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.key)}
            className={`flex-1 rounded-md px-3 py-2 text-xs font-semibold transition ${
              isActive
                ? "bg-custom-primary-100 text-custom-text-100 shadow-custom-shadow-2xs"
                : "text-custom-text-300 hover:text-custom-text-100"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
    <div className="mt-2 text-[11px] text-custom-text-300">
      {TAB_OPTIONS.find((tab) => tab.key === value)?.helper}
    </div>
  </div>
);
