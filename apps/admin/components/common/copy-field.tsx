/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
// ui
import { Button } from "@makeplane/propel/elements/button";
import { Icon } from "@makeplane/propel/components/icon";
import { CopyOutline } from "@makeplane/propel/icons";
// components
import { setToast } from "@plane/blocks/toast";

type Props = {
  label: string;
  url: string;
  description: string | React.ReactNode;
};

export type TCopyField = {
  key: string;
  label: string;
  url: string;
  description: string | React.ReactNode;
};

export function CopyField(props: Props) {
  const { label, url, description } = props;

  return (
    <div className="flex flex-col gap-1">
      <h4 className="text-13 text-secondary">{label}</h4>
      <Button
        variant="secondary"
        size="md"
        stretch="full"
        type="button"
        onClick={() => {
          navigator.clipboard.writeText(url);
          setToast({
            type: "info",
            title: "Copied to clipboard",
            message: `The ${label} has been successfully copied to your clipboard`,
          });
        }}
      >
        <span className="min-w-0 flex-1 truncate text-left" title={url}>
          {url}
        </span>
        <Icon icon={CopyOutline} />
      </Button>
      <div className="text-11 text-tertiary">{description}</div>
    </div>
  );
}
