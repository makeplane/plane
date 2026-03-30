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

import { Rocket } from "lucide-react";
import { Combobox } from "@headlessui/react";
import { EpicIcon } from "@plane/propel/icons";
import type { ISearchIssueResponse } from "@plane/types";
import { Checkbox } from "@plane/ui";
import { generateWorkItemLink } from "@plane/utils";
import { IdentifierText } from "@/components/issues/issue-detail/identifier-text";

type Props = {
  epic: ISearchIssueResponse;
  workspaceSlug: string | undefined;
  selected: boolean;
};

export function WorkspaceEpicOption({ epic, workspaceSlug, selected }: Props) {
  return (
    <Combobox.Option
      as="label"
      htmlFor={`epic-${epic.id}`}
      value={epic}
      className={({ active }) =>
        `group flex w-full cursor-pointer select-none items-center justify-between gap-2 rounded-md px-3 py-2 my-0.5 text-secondary ${active ? "bg-layer-1-hover text-primary" : ""} ${selected ? "text-primary" : ""}`
      }
    >
      <div className="flex items-center gap-2 truncate">
        <Checkbox checked={selected} readOnly />
        <span
          className="block h-1.5 w-1.5 shrink-0 rounded-full"
          style={{
            backgroundColor: epic.state__color,
          }}
        />
        <div className="flex shrink-0 items-center space-x-2">
          <EpicIcon className="h-4 w-4 text-tertiary" />
          <IdentifierText
            identifier={`${epic.project__identifier}-${epic.sequence_id}`}
            enableClickToCopyIdentifier
            size="xs"
            variant="secondary"
          />
        </div>
        <span className="truncate">{epic.name}</span>
      </div>
      <a
        href={generateWorkItemLink({
          workspaceSlug,
          projectId: epic?.project_id,
          issueId: epic?.id,
          projectIdentifier: epic?.project__identifier,
          sequenceId: epic?.sequence_id,
        })}
        target="_blank"
        className="z-1 relative hidden shrink-0 text-secondary hover:text-primary group-hover:block"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
      >
        <Rocket className="h-4 w-4" />
      </a>
    </Combobox.Option>
  );
}
