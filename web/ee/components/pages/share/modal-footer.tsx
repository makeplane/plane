"use client";

import { Button } from "@plane/ui";

type TModalFooterProps = {
  hasUnsavedChanges: boolean;
  isSubmitting: boolean;
  onCancel: () => void;
  onSave: () => void;
  canCurrentUserChangeAccess?: boolean;
};

export const ModalFooter = ({
  hasUnsavedChanges,
  isSubmitting,
  onCancel,
  onSave,
  canCurrentUserChangeAccess = true,
}: TModalFooterProps) => (
  <div className="mt-3">
    <div className="px-4 py-3 flex items-center justify-between border-t-[0.5px] border-custom-border-300">
      <div className="shrink-0 text-sm text-custom-text-400" role="status" aria-label="Change status">
        {hasUnsavedChanges && canCurrentUserChangeAccess && (
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-custom-primary-100 rounded-full animate-pulse" />
            <span className="text-xs text-custom-primary-100 font-medium">Unsaved changes</span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button variant="neutral-primary" size="sm" onClick={onCancel} disabled={isSubmitting}>
          {canCurrentUserChangeAccess ? "Cancel" : "Close"}
        </Button>
        {canCurrentUserChangeAccess && (
          <Button variant="primary" size="sm" onClick={onSave} loading={isSubmitting} disabled={!hasUnsavedChanges}>
            {isSubmitting ? "Saving..." : "Share"}
          </Button>
        )}
      </div>
    </div>
  </div>
);

ModalFooter.displayName = "ModalFooter";
