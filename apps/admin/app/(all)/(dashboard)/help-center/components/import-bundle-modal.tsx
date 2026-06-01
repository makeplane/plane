/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useRef, useState } from "react";
import { observer } from "mobx-react";
import { Upload } from "lucide-react";
import { Button } from "@plane/propel/button";
import { Dialog, EDialogWidth } from "@plane/propel/dialog";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { useInstanceHelpCenter } from "@/hooks/store";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export const ImportBundleModal = observer(function ImportBundleModal({ isOpen, onClose }: Props) {
  const { importBundle } = useInstanceHelpCenter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    setFile(null);
    setIsSubmitting(false);
    onClose();
  };

  const handleSubmit = async () => {
    if (!file) return;
    setIsSubmitting(true);
    try {
      const result = await importBundle(file);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: `Imported ${result.categories} categories, ${result.articles} articles, ${result.images} images`,
      });
      handleClose();
    } catch (err) {
      const error = err as { error?: unknown };
      setToast({
        type: TOAST_TYPE.ERROR,
        title: typeof error?.error === "string" ? error.error : "Import failed",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o: boolean) => !o && handleClose()} modal>
      <Dialog.Panel width={EDialogWidth.MD}>
        <div className="p-6">
          <Dialog.Title>Import help bundle</Dialog.Title>
          <div className="mt-4 space-y-4">
            <p className="text-13 text-secondary">
              Importing a bundle <strong>overwrites matching articles in THIS environment</strong> with the
              bundle&apos;s content and uploads its images here. Use this to promote a reviewed bundle from one
              environment to another (for example, UAT to Production). This action cannot be undone.
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept=".zip,application/zip"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-3 rounded-md border border-dashed border-subtle p-5 w-full hover:bg-layer-2 transition-colors"
            >
              <Upload className="size-5 text-tertiary" />
              <span className="text-13">{file ? file.name : "Click to select a bundle (.zip)"}</span>
            </button>
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              type="button"
              loading={isSubmitting}
              disabled={!file || isSubmitting}
              onClick={() => void handleSubmit()}
            >
              Import
            </Button>
          </div>
        </div>
      </Dialog.Panel>
    </Dialog>
  );
});
