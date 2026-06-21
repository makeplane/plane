/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useRef, useState } from "react";
import type { Placement } from "@popperjs/core";
import { Combobox } from "@headlessui/react";
import { FastForward } from "lucide-react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { usePopper } from "react-popper";
import { Logo } from "@plane/propel/emoji-icon-picker";
import { CheckIcon, SearchIcon } from "@plane/propel/icons";
import type { TLogoProps } from "@plane/types";
import { useWorkspaceSprint } from "@/hooks/store/use-workspace-sprint";
import { usePlatformOS } from "@/hooks/use-platform-os";

type Props = {
  isOpen: boolean;
  placement?: Placement;
  referenceElement: HTMLButtonElement | null;
};

export const WorkspaceSprintOptions = observer(function WorkspaceSprintOptions(props: Props) {
  const { isOpen, placement, referenceElement } = props;
  const [query, setQuery] = useState("");
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { workspaceSlug } = useParams();
  const { currentWorkspaceSprintIds, fetchedMap, fetchWorkspaceSprints, getSprintAutomationById, getSprintById } =
    useWorkspaceSprint();
  const { isMobile } = usePlatformOS();

  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: placement ?? "bottom-start",
    modifiers: [
      {
        name: "preventOverflow",
        options: {
          padding: 12,
        },
      },
    ],
  });

  useEffect(() => {
    if (!isOpen || !workspaceSlug) return;
    const slug = workspaceSlug.toString();
    if (!fetchedMap[slug]) fetchWorkspaceSprints(slug);
    if (!isMobile) inputRef.current?.focus();
  }, [fetchWorkspaceSprints, fetchedMap, isMobile, isOpen, workspaceSlug]);

  const sprintIds = currentWorkspaceSprintIds ?? [];
  const options = [
    {
      value: null,
      query: "No sprint",
      content: (
        <div className="flex items-center gap-2">
          <FastForward className="h-3 w-3 flex-shrink-0 stroke-[1.5] text-placeholder" />
          <span className="flex-grow truncate">No sprint</span>
        </div>
      ),
    },
    ...sprintIds.map((sprintId: string) => {
      const sprint = getSprintById(sprintId);
      const automation = getSprintAutomationById(sprint?.automation_id);
      return {
        value: sprintId,
        query: sprint?.name ?? "Sprint",
        content: (
          <div className="flex items-center gap-2">
            <WorkspaceSprintOptionIcon logoProps={automation?.logo_props} />
            <span className="flex-grow truncate">{sprint?.name ?? "Sprint"}</span>
          </div>
        ),
      };
    }),
  ];
  const filteredOptions =
    query === "" ? options : options.filter((option) => option.query.toLowerCase().includes(query.toLowerCase()));

  return (
    <Combobox.Options className="fixed z-10" static>
      <div
        className="my-1 w-48 rounded-sm border-[0.5px] border-strong bg-surface-1 px-2 py-2.5 text-11 shadow-raised-200 focus:outline-none"
        ref={setPopperElement}
        style={styles.popper}
        {...attributes.popper}
      >
        <div className="flex items-center gap-1.5 rounded-sm border border-subtle bg-surface-2 px-2">
          <SearchIcon className="h-3.5 w-3.5 text-placeholder" strokeWidth={1.5} />
          <Combobox.Input
            as="input"
            ref={inputRef}
            className="w-full bg-transparent py-1 text-11 text-secondary placeholder:text-placeholder focus:outline-none"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search"
            onKeyDown={(event) => {
              if (query !== "" && event.key === "Escape") {
                event.stopPropagation();
                setQuery("");
              }
            }}
          />
        </div>
        <div className="mt-2 max-h-48 space-y-1 overflow-y-scroll">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <Combobox.Option
                key={option.value ?? "no-sprint"}
                value={option.value}
                className={({ active, selected }) =>
                  `flex w-full cursor-pointer items-center justify-between gap-2 truncate rounded-sm px-1 py-1.5 select-none ${
                    active ? "bg-layer-transparent-hover" : ""
                  } ${selected ? "text-primary" : "text-secondary"}`
                }
              >
                {({ selected }) => (
                  <>
                    <span className="flex-grow truncate">{option.content}</span>
                    {selected && <CheckIcon className="h-3.5 w-3.5 flex-shrink-0" />}
                  </>
                )}
              </Combobox.Option>
            ))
          ) : (
            <p className="px-1.5 py-1 text-placeholder italic">No matches found</p>
          )}
        </div>
      </div>
    </Combobox.Options>
  );
});

function WorkspaceSprintOptionIcon({ logoProps }: { logoProps: TLogoProps | undefined }) {
  return logoProps?.in_use ? (
    <Logo logo={logoProps} size={12} type="material" />
  ) : (
    <FastForward className="h-3 w-3 flex-shrink-0 stroke-[1.5] text-placeholder" />
  );
}
