/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { Banner } from "@makeplane/propel/components/banner";
import { Button } from "@makeplane/propel/components/button";
import { Icon } from "@makeplane/propel/components/icon";
import { TransferWorkItemOutline } from "@makeplane/propel/icons";

type Props = {
  handleClick: () => void;
  canTransferIssues?: boolean;
  disabled?: boolean;
};

export function TransferIssues(props: Props) {
  const { handleClick, canTransferIssues = false, disabled = false } = props;
  return (
    <div className="mb-4">
      <Banner
        placement="page"
        variant="neutral"
        title="Completed cycles are not editable."
        actions={
          canTransferIssues && (
            <Button
              variant="primary"
              size="md"
              stretch="auto"
              icon={<Icon icon={TransferWorkItemOutline} />}
              iconPosition="start"
              onClick={handleClick}
              disabled={disabled}
              label="Transfer work items"
            />
          )
        }
      />
    </div>
  );
}
