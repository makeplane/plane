/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Banner as PropelBanner } from "@makeplane/propel/components/banner";
import { TickCircleOutline } from "@makeplane/propel/icons";

type TBanner = {
  type: "success" | "error";
  message: string;
};

export function Banner(props: TBanner) {
  const { type, message } = props;

  if (type === "error") {
    return <PropelBanner placement="inline" size="sm" variant="danger" description={message} />;
  }

  // Propel 0.9.7 has no success variant; retain the existing exported success presentation.
  return (
    <div className="w-full rounded-md border border-success-strong bg-success-subtle p-2">
      <div className="flex items-center justify-center">
        <div className="flex-shrink-0">
          <TickCircleOutline className="h-5 w-5 text-success-primary" aria-hidden="true" />
        </div>
        <div className="ml-1">
          <p className="text-13 font-medium text-success-primary">{message}</p>
        </div>
      </div>
    </div>
  );
}
