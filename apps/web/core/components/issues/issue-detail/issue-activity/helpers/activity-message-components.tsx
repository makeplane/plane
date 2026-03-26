/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import type { EInboxIssueSource as EInboxIssueSourceType } from "@plane/types";
import { capitalizeFirstLetter, replaceUnderscoreIfSnakeCase } from "@plane/utils";

const VALUE_CLASS = "font-medium text-primary";
const ACTIVITY_LINK_CLASS = "inline-flex items-center gap-1 truncate font-medium text-primary hover:underline";

/** Renders a bold value span for activity messages. */
export function Bold({ value }: { value: string | undefined }) {
  if (!value) return null;
  return <span className={VALUE_CLASS}>{value}</span>;
}

/** Renders a truncated link for activity content. */
export function ActivityLink({ href, label }: { href: string; label: string | undefined }) {
  if (!label) return null;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={ACTIVITY_LINK_CLASS}>
      <span className="truncate">{label}</span>
    </a>
  );
}

/** Renders the "created via {source}" label for work items created from external sources. */
export function SourceCreatedLabel({ source }: { source: EInboxIssueSourceType }) {
  return (
    <span>
      created the work item via{" "}
      <span className={VALUE_CLASS}>
        {capitalizeFirstLetter(replaceUnderscoreIfSnakeCase(source).toLowerCase() || "")}
      </span>
      .
    </span>
  );
}

/** Renders the "converted {identifier} to epic" message. */
export function ConvertedToEpicLabel({
  identifier,
  sequenceId,
}: {
  identifier: string | undefined;
  sequenceId: number | undefined;
}) {
  return (
    <>
      converted <span className={VALUE_CLASS}>{`${identifier}-${sequenceId}`}</span> to epic.
    </>
  );
}

/** Renders the "converted {identifier} to work item" message. */
export function ConvertedToWorkItemLabel({
  identifier,
  sequenceId,
}: {
  identifier: string | undefined;
  sequenceId: number | undefined;
}) {
  return (
    <>
      converted <span className={VALUE_CLASS}>{`${identifier}-${sequenceId}`}</span> to work item.
    </>
  );
}
