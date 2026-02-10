"use client";

import { X } from "lucide-react";
import { renderFormattedPayloadDate } from "@plane/utils";
import { CategoryDropdown } from "@/components/dropdowns/category-property";
import { DateDropdown } from "@/components/dropdowns/date";
import { LevelDropdown } from "@/components/dropdowns/level-property";
import { MemberDropdown } from "@/components/dropdowns/member/dropdown";
import { ProgramDropdown } from "@/components/dropdowns/program-property";
import SportDropdown from "@/components/dropdowns/sport-property";
import { TimeDropdown } from "@/components/dropdowns/time-picker";
import { YearRangeDropdown } from "@/components/dropdowns/year-property";
import type { TMetaFieldChange, TMetaFormState, TUploadTarget } from "./media-library-upload-types";

type Props = {
  projectId: string;
  uploadTarget: TUploadTarget;
  meta: TMetaFormState;
  isLocked: boolean;
  onFieldChange: TMetaFieldChange;
  tagDraft: string;
  onTagDraftChange: (value: string) => void;
  onAddTag: (value: string) => void;
  onRemoveTag: (value: string) => void;
};

export const MediaLibraryUploadMetaForm = ({
  projectId,
  uploadTarget,
  meta,
  isLocked,
  onFieldChange,
  tagDraft,
  onTagDraftChange,
  onAddTag,
  onRemoveTag,
}: Props) => (
  <div className="mb-4 rounded-lg border border-custom-border-200 bg-custom-background-90 p-4">
    <div className="text-xs font-semibold text-custom-text-100">Metadata (optional)</div>
    <div className="mt-3 grid grid-flow-col auto-cols-fr gap-3">
      <div className="flex flex-col gap-1 text-[11px] text-custom-text-300">
        <span>Category</span>
        <CategoryDropdown
          value={meta.category}
          onChange={(val) => onFieldChange("category", val)}
          placeholder={uploadTarget === "work-item" ? "Work items" : "Uploads"}
          buttonVariant="border-with-text"
          className="h-8"
          buttonContainerClassName="w-full text-left"
          buttonClassName={`text-xs ${meta.category ? "" : "text-custom-text-400"}`}
          hideIcon
          clearIconClassName="h-3 w-3"
          dropdownClassName="z-[70]"
          disabled={isLocked}
        />
      </div>
      <div className="flex flex-col gap-1 text-[11px] text-custom-text-300">
        <span>Created by</span>
        <MemberDropdown
          value={meta.createdByMemberId}
          onChange={(val) => onFieldChange("createdByMemberId", val)}
          projectId={projectId}
          multiple={false}
          placeholder="Select member"
          buttonVariant="border-with-text"
          className="h-8"
          buttonContainerClassName="w-full text-left"
          buttonClassName={`text-xs ${meta.createdByMemberId ? "" : "text-custom-text-400"}`}
          showUserDetails
        />
      </div>
      <div className="flex flex-col gap-1 text-[11px] text-custom-text-300">
        <span>Sport</span>
        <SportDropdown
          value={meta.sport}
          onChange={(val) => onFieldChange("sport", val)}
          placeholder="Select sport"
          buttonVariant="border-with-text"
          className="h-8"
          buttonContainerClassName="w-full text-left"
          buttonClassName={`text-xs ${meta.sport ? "" : "text-custom-text-400"}`}
          hideIcon
          clearIconClassName="h-3 w-3"
          dropdownClassName="z-[70]"
          disabled={isLocked}
        />
      </div>
      <div className="flex flex-col gap-1 text-[11px] text-custom-text-300">
        <span>Program</span>
        <ProgramDropdown
          value={meta.program}
          onChange={(val) => onFieldChange("program", val)}
          placeholder="Select program"
          buttonVariant="border-with-text"
          className="h-8"
          buttonContainerClassName="w-full text-left"
          buttonClassName={`text-xs ${meta.program ? "" : "text-custom-text-400"}`}
          hideIcon
          clearIconClassName="h-3 w-3"
          dropdownClassName="z-[70]"
          disabled={isLocked}
        />
      </div>
      <div className="flex flex-col gap-1 text-[11px] text-custom-text-300">
        <span>Level</span>
        <LevelDropdown
          value={meta.level}
          onChange={(val) => onFieldChange("level", val)}
          placeholder="Select level"
          buttonVariant="border-with-text"
          className="h-8"
          buttonContainerClassName="w-full text-left"
          buttonClassName={`text-xs ${meta.level ? "" : "text-custom-text-400"}`}
          hideIcon
          clearIconClassName="h-3 w-3"
          dropdownClassName="z-[70]"
          disabled={isLocked}
        />
      </div>
      <div className="flex flex-col gap-1 text-[11px] text-custom-text-300">
        <span>Season</span>
        <YearRangeDropdown
          value={meta.season}
          onChange={(val) => onFieldChange("season", val)}
          placeholder="Select season"
          buttonVariant="border-with-text"
          className="h-8"
          buttonContainerClassName="w-full text-left"
          buttonClassName={`text-xs ${meta.season ? "" : "text-custom-text-400"}`}
          hideIcon
          clearIconClassName="h-3 w-3"
          dropdownClassName="z-[70]"
          disabled={isLocked}
        />
      </div>
      {uploadTarget === "work-item" ? (
        <>
          <div className="flex flex-col gap-1 text-[11px] text-custom-text-300">
            <span>Start date</span>
            <DateDropdown
              value={meta.startDate}
              onChange={(val) => onFieldChange("startDate", val ? renderFormattedPayloadDate(val) : null)}
              placeholder="Select date"
              buttonVariant="border-with-text"
              className="h-8"
              buttonContainerClassName="w-full text-left"
              buttonClassName={`text-xs ${meta.startDate ? "" : "text-custom-text-400"}`}
              hideIcon
              clearIconClassName="h-3 w-3"
              optionsClassName="z-[70]"
              disabled={isLocked}
            />
          </div>
          <div className="flex flex-col gap-1 text-[11px] text-custom-text-300">
            <span>Start time</span>
            <TimeDropdown
              value={meta.startTime}
              onChange={(val) => onFieldChange("startTime", val)}
              placeholder="Select time"
              buttonVariant="border-with-text"
              className="h-8"
              buttonContainerClassName="w-full text-left"
              buttonClassName={`text-xs ${meta.startTime ? "" : "text-custom-text-400"}`}
              hideIcon
              clearIconClassName="h-3 w-3"
              optionsClassName="z-[70]"
              disabled={isLocked}
            />
          </div>
        </>
      ) : null}
    </div>
    <div className="mt-3 text-[11px] text-custom-text-300">
      <div>Tags</div>
      <div className="mt-1 flex flex-wrap items-center gap-2 rounded-md border border-custom-border-200 bg-custom-background-100 px-2 py-1.5">
        {meta.tags.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 rounded-full border border-custom-border-200 bg-custom-background-90 px-2 py-0.5 text-xs text-custom-text-100"
          >
            {tag}
            <button
              type="button"
              onClick={() => onRemoveTag(tag)}
              className="text-custom-text-300 hover:text-custom-text-100"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={tagDraft}
          onChange={(event) => onTagDraftChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === ",") {
              event.preventDefault();
              onAddTag(tagDraft);
            }
          }}
          placeholder={meta.tags.length === 0 ? "Add tags" : ""}
          className="min-w-[140px] flex-1 bg-transparent px-1 py-0.5 text-xs text-custom-text-100 placeholder:text-custom-text-400 focus:outline-none"
        />
      </div>
      <div className="mt-1 text-[10px] text-custom-text-300">Press comma or Enter to add.</div>
    </div>
    <div className="mt-2 text-[11px] text-custom-text-300">
      Metadata applies to all selected files.
      {isLocked ? " Values are read-only when a work item is selected." : ""}
    </div>
  </div>
);
