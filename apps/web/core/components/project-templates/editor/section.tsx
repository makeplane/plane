/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { cn } from "@plane/utils";

type TSection = {
  title: string;
  error?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

/**
 * Lightweight visual frame for each editor section (heading + add-action
 * button, children row block, optional inline error). Keeps section heading
 * typography and spacing consistent across states/labels/modules/cycles/
 * starter-issues.
 */
export function Section(props: TSection) {
  const { title, error, action, children, className } = props;
  return (
    <section className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-h6-medium text-primary">{title}</h3>
        {action}
      </div>
      <div className="flex flex-col gap-2">{children}</div>
      {error && (
        <p className="text-body-xs-regular text-danger-primary" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
