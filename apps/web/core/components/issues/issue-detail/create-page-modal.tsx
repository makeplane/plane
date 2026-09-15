/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
// plane imports
import { Button } from "@plane/propel/button";
import { EModalPosition, EModalWidth, Input, ModalCore } from "@plane/ui";

type Props = {
  isOpen: boolean;
  defaultName: string;
  onClose: () => void;
  onSubmit: (name: string) => Promise<void>;
};

export function CreateIssuePageModal(props: Props) {
  const { isOpen, defaultName, onClose, onSubmit } = props;
  // states
  const [name, setName] = useState(defaultName);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // reset the name to the work item name every time the modal opens
  useEffect(() => {
    if (isOpen) setName(defaultName);
  }, [isOpen, defaultName]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(name.trim());
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={onClose} position={EModalPosition.CENTER} width={EModalWidth.XXL}>
      <form onSubmit={handleSubmit} className="space-y-5 p-5">
        <h3 className="text-14 font-medium text-primary">Create page</h3>
        <Input
          id="work-item-page-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Page name"
          className="w-full"
          autoFocus
        />
        <div className="flex items-center justify-end gap-2">
          <Button variant="secondary" size="lg" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="lg" type="submit" loading={isSubmitting} disabled={isSubmitting}>
            {isSubmitting ? "Creating" : "Create and link"}
          </Button>
        </div>
      </form>
    </ModalCore>
  );
}
