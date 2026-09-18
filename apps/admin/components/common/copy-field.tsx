/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
// ui
import { Button } from "@makeplane/propel/components/button";
import { CopyOutline } from "@makeplane/propel/icons";
// components
import { TOAST_TYPE, setToast } from "@/providers/toast";

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
        stretch="auto"
        icon={<CopyOutline width={18} height={18} color="#B9B9B9" />}
        iconPosition="end"
        label={url}
        onClick={() => {
          navigator.clipboard.writeText(url);
          setToast({
            type: TOAST_TYPE.INFO,
            title: "Copied to clipboard",
            message: `The ${label} has been successfully copied to your clipboard`,
          });
        }}
      />
      <div className="text-11 text-tertiary">{description}</div>
    </div>
  );
}
