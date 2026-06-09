import React, { useState } from "react";
import { ModalCore } from "@plane/ui";

type ConfirmStateChangeModalProps = {
  isOpen: boolean;
  onConfirm: (note: string) => void;
  onCancel: () => void;
};

export const ConfirmStateChangeModal = ({ isOpen, onConfirm, onCancel }: ConfirmStateChangeModalProps) => {
  const [note, setNote] = useState("");

  if (!isOpen) return null;

  return (
    <ModalCore isOpen={isOpen} handleClose={onCancel}>
      <div data-prevent-outside-click="true" className="w-full h-full">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start">
          <span className="grid size-12 flex-shrink-0 place-items-center rounded-full bg-accent-primary/20 text-accent-primary sm:size-10">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </span>
          <div className="flex-1 w-full text-center sm:text-left">
            <h3 className="text-16 font-medium">Change Status?</h3>
            <p className="mt-1 text-13 text-secondary whitespace-pre-wrap">Are you sure you want to change the status of this ticket? Please provide a mandatory note explaining the reason.</p>
            <div className="mt-4">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Enter your note here..."
                className="w-full rounded-md border border-custom-border-200 bg-custom-background-90 p-3 text-sm text-custom-text-100 placeholder:text-custom-text-400 focus:border-accent-primary focus:outline-none focus:ring-1 focus:ring-accent-primary min-h-[100px] resize-none"
                required
              />
            </div>
          </div>
        </div>
        <div className="flex flex-col-reverse gap-2 border-t-[0.5px] border-subtle px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => { setNote(""); onCancel(); }}
            className="inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium bg-custom-background-90 border border-custom-border-200 text-custom-text-200 hover:bg-custom-background-80 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              if (note.trim()) {
                onConfirm(note.trim());
                setNote("");
              }
            }}
            disabled={!note.trim()}
            className="inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium text-on-color bg-accent-primary hover:bg-accent-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Change Status
          </button>
        </div>
      </div>
    </ModalCore>
  );
};
