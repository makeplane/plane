/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { Button } from "@makeplane/propel/components/button";
import { Collapsible } from "@makeplane/propel/components/collapsible";

type Props = {
  openDeleteModal: () => void;
};

export function WebhookDeleteSection(props: Props) {
  const { openDeleteModal } = props;
  // states
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="w-full border-t border-subtle">
      <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
        trigger={<span className="text-16 tracking-tight">Danger zone</span>}
      >
        <div className="flex flex-col gap-8">
          <span className="text-13 tracking-tight">
            Once a webhook is deleted, it cannot be restored. Future events will no longer be delivered to this webhook.
          </span>
          <div>
            <Button variant="danger" size="md" stretch="auto" label="Delete webhook" onClick={openDeleteModal} />
          </div>
        </div>
      </Collapsible>
    </div>
  );
}
