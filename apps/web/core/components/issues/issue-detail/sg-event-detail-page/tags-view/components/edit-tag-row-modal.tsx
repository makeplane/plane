import { X } from "lucide-react";
import { EModalPosition, EModalWidth, Input, ModalCore } from "@plane/ui";
import type { SgTagRow, SgTagRowEditPayload } from "../../types";

const EDITABLE_TAG_FIELDS: Array<{ key: keyof SgTagRowEditPayload; label: string; placeholder: string }> = [
  { key: "player", label: "Player", placeholder: "Player" },
  { key: "groupValue", label: "Group", placeholder: "Group" },
  { key: "action", label: "Action", placeholder: "Action" },
  { key: "primaryDetail", label: "Primary detail", placeholder: "Primary detail" },
  { key: "secondaryDetail", label: "Secondary detail", placeholder: "Secondary detail" },
  { key: "result", label: "Result", placeholder: "Result" },
  { key: "team", label: "Team", placeholder: "Team" },
  { key: "timecode", label: "Timecode", placeholder: "00:00-00:05" },
];

type EditTagRowModalProps = {
  draft: SgTagRowEditPayload;
  isOpen: boolean;
  onChange: (key: keyof SgTagRowEditPayload, value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
  row: SgTagRow | null;
};

export const EditTagRowModal = ({ draft, isOpen, onChange, onClose, onSubmit, row }: EditTagRowModalProps) => (
  <ModalCore isOpen={isOpen} handleClose={onClose} position={EModalPosition.TOP} width={EModalWidth.XXL}>
    <div className="border-b border-custom-border-200 px-5 py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-custom-text-100">Edit tag row</h3>
          <p className="mt-1 truncate text-sm text-custom-text-300">
            {row ? `${row.action || "Tag"} · ${row.timecode || "No timecode"}` : "Update row details"}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1.5 text-custom-text-400 transition-colors hover:bg-custom-background-90 hover:text-custom-text-200"
          aria-label="Close edit tag row modal"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className="grid gap-4 p-5 md:grid-cols-2">
        {EDITABLE_TAG_FIELDS.map((field) => (
          <div key={field.key} className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wide text-custom-text-400">{field.label}</label>
            <Input
              value={draft[field.key]}
              onChange={(event) => onChange(field.key, event.target.value)}
              placeholder={field.placeholder}
              className="w-full border-custom-border-200 bg-custom-background-100"
              autoFocus={field.key === "player"}
            />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-end gap-2 border-t border-custom-border-200 px-5 py-4">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-8 items-center rounded-md border border-custom-border-200 bg-custom-background-100 px-3 text-sm font-medium text-custom-text-300 transition-colors hover:bg-custom-background-90 hover:text-custom-text-100"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="inline-flex h-8 items-center rounded-md bg-custom-primary-100 px-3 text-sm font-medium text-white transition-colors hover:bg-custom-primary-200"
        >
          Save changes
        </button>
      </div>
    </form>
  </ModalCore>
);
