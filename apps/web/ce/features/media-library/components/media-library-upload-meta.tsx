"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";
import { CategoryDropdown } from "@/components/dropdowns/category-property";
import { LevelDropdown } from "@/components/dropdowns/level-property";
import { MemberDropdown } from "@/components/dropdowns/member/dropdown";
import { ProgramDropdown } from "@/components/dropdowns/program-property";
import SportDropdown from "@/components/dropdowns/sport-property";
import { YearRangeDropdown } from "@/components/dropdowns/year-property";
import { UPLOAD_MODAL_TEXT_CLASS } from "./media-library-upload-style-classes";
import type { TMetaFieldChange, TMetaFormState, TUploadTarget } from "./media-library-upload-types";

type Props = {
  projectId: string;
  uploadTarget: TUploadTarget;
  workItemSelector: ReactNode;
  meta: TMetaFormState;
  isLocked: boolean;
  onFieldChange: TMetaFieldChange;
  tagDraft: string;
  onTagDraftChange: (value: string) => void;
  onAddTag: (value: string) => void;
  onRemoveTag: (value: string) => void;
};

const FIELD_BUTTON_BASE_CLASS = `h-8 border-custom-border-200 bg-custom-background-100 ${UPLOAD_MODAL_TEXT_CLASS.field} hover:bg-custom-background-90 dark:border-[#303030] dark:bg-[#171717] dark:hover:bg-[#1C1C1C]`;
const getFieldButtonClassName = (_hasValue: boolean) => `${FIELD_BUTTON_BASE_CLASS} text-xs`;
const getFieldButtonContainerClassName = (isLocked: boolean) => `w-full text-left ${isLocked ? "cursor-default" : ""}`;
const FIELD_LABEL_CLASS = `pl-1 ${UPLOAD_MODAL_TEXT_CLASS.label}`;

export const MediaLibraryUploadMetaForm = ({
  projectId,
  uploadTarget,
  workItemSelector,
  meta,
  isLocked,
  onFieldChange,
  tagDraft,
  onTagDraftChange,
  onAddTag,
  onRemoveTag,
}: Props) => (
  <div className="mb-4 rounded-lg border border-custom-border-200 bg-custom-background-90 p-4 dark:border-[#303030] dark:bg-[#151515]">
    <div className={`text-xs font-bold ${UPLOAD_MODAL_TEXT_CLASS.primary}`}>
      Metadata <span className={`font-normal ${UPLOAD_MODAL_TEXT_CLASS.optional}`}>(Optional)</span>
    </div>
    <div className="mt-2">{workItemSelector}</div>
    <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-6">
      <div className={`flex flex-col gap-1 text-[11px] ${UPLOAD_MODAL_TEXT_CLASS.label}`}>
        <span className={FIELD_LABEL_CLASS}>Category</span>
        <CategoryDropdown
          value={meta.category}
          onChange={(val) => onFieldChange("category", val)}
          placeholder={uploadTarget === "work-item" ? "Work items" : "Uploads"}
          buttonVariant="border-with-text"
          className="h-8"
          buttonContainerClassName={getFieldButtonContainerClassName(isLocked)}
          buttonClassName={getFieldButtonClassName(Boolean(meta.category))}
          hideIcon
          clearIconClassName="h-3 w-3"
          dropdownClassName="z-[70]"
          disabled={isLocked}
        />
      </div>
      <div className={`flex flex-col gap-1 text-[11px] ${UPLOAD_MODAL_TEXT_CLASS.label}`}>
        <span className={FIELD_LABEL_CLASS}>Sport</span>
        <SportDropdown
          value={meta.sport}
          onChange={(val) => onFieldChange("sport", val)}
          placeholder="Select sport"
          buttonVariant="border-with-text"
          className="h-8"
          buttonContainerClassName={getFieldButtonContainerClassName(isLocked)}
          buttonClassName={getFieldButtonClassName(Boolean(meta.sport))}
          hideIcon
          clearIconClassName="h-3 w-3"
          dropdownClassName="z-[70]"
          disabled={isLocked}
        />
      </div>
      <div className={`flex flex-col gap-1 text-[11px] ${UPLOAD_MODAL_TEXT_CLASS.label}`}>
        <span className={FIELD_LABEL_CLASS}>Created by</span>
        <MemberDropdown
          value={meta.createdByMemberId}
          onChange={(val) => onFieldChange("createdByMemberId", val)}
          projectId={projectId}
          multiple={false}
          placeholder="Select member"
          buttonVariant="border-with-text"
          className="h-8"
          buttonContainerClassName={getFieldButtonContainerClassName(isLocked)}
          buttonClassName={getFieldButtonClassName(Boolean(meta.createdByMemberId))}
          optionsClassName="z-[70]"
          disabled={isLocked}
          showUserDetails
        />
      </div>
      <div className={`flex flex-col gap-1 text-[11px] ${UPLOAD_MODAL_TEXT_CLASS.label}`}>
        <span className={FIELD_LABEL_CLASS}>Program</span>
        <ProgramDropdown
          value={meta.program}
          onChange={(val) => onFieldChange("program", val)}
          placeholder="Select program"
          buttonVariant="border-with-text"
          className="h-8"
          buttonContainerClassName={getFieldButtonContainerClassName(isLocked)}
          buttonClassName={getFieldButtonClassName(Boolean(meta.program))}
          hideIcon
          clearIconClassName="h-3 w-3"
          dropdownClassName="z-[70]"
          disabled={isLocked}
        />
      </div>
      <div className={`flex flex-col gap-1 text-[11px] ${UPLOAD_MODAL_TEXT_CLASS.label}`}>
        <span className={FIELD_LABEL_CLASS}>Level</span>
        <LevelDropdown
          value={meta.level}
          onChange={(val) => onFieldChange("level", val)}
          placeholder="Select level"
          buttonVariant="border-with-text"
          className="h-8"
          buttonContainerClassName={getFieldButtonContainerClassName(isLocked)}
          buttonClassName={getFieldButtonClassName(Boolean(meta.level))}
          hideIcon
          clearIconClassName="h-3 w-3"
          dropdownClassName="z-[70]"
          disabled={isLocked}
        />
      </div>
      <div className={`flex flex-col gap-1 text-[11px] ${UPLOAD_MODAL_TEXT_CLASS.label}`}>
        <span className={FIELD_LABEL_CLASS}>Season</span>
        <YearRangeDropdown
          value={meta.season}
          onChange={(val) => onFieldChange("season", val)}
          placeholder="Select season"
          buttonVariant="border-with-text"
          className="h-8"
          buttonContainerClassName={getFieldButtonContainerClassName(isLocked)}
          buttonClassName={getFieldButtonClassName(Boolean(meta.season))}
          hideIcon
          clearIconClassName="h-3 w-3"
          dropdownClassName="z-[70]"
          disabled={isLocked}
        />
      </div>
    </div>
    <div className={`mt-3 text-[11px] ${UPLOAD_MODAL_TEXT_CLASS.label}`}>
      <div>Tags</div>
      <div className="mt-1 flex flex-wrap items-center gap-2 rounded-md border border-custom-border-200 bg-custom-background-100 px-2 py-1.5 dark:border-[#303030] dark:bg-[#171717]">
        {meta.tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full border border-custom-primary-100/30 bg-custom-primary-100/15 px-2 py-0.5 text-[11px] font-medium text-custom-primary-100 dark:border-[#2D9CDB]/30 dark:bg-[#2D9CDB]/15 dark:text-[#2D9CDB]"
          >
            {tag}
            <button
              type="button"
              onClick={() => onRemoveTag(tag)}
              className="text-custom-primary-100/80 hover:text-custom-primary-100 dark:text-[#2D9CDB]/80 dark:hover:text-[#2D9CDB]"
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
          className={`min-w-[140px] flex-1 bg-transparent px-1 py-0.5 text-[11px] ${UPLOAD_MODAL_TEXT_CLASS.input} ${UPLOAD_MODAL_TEXT_CLASS.inputPlaceholder} focus:outline-none`}
        />
      </div>
      <div className="mt-1 flex items-center justify-between gap-3">
        <div className={`text-[10px] ${UPLOAD_MODAL_TEXT_CLASS.muted}`}>Press comma or Enter to add.</div>
        <div className={`text-[11px] ${UPLOAD_MODAL_TEXT_CLASS.muted}`}>Metadata applies to all selected files.</div>
      </div>
    </div>
  </div>
);
