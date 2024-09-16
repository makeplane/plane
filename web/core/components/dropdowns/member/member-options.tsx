"use client";

import { useEffect, useRef, useState } from "react";
import { Placement } from "@popperjs/core";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { createPortal } from "react-dom";
import { usePopper } from "react-popper";
import { Check, Search } from "lucide-react";
import { Combobox } from "@headlessui/react";
//components
import { cn } from "@plane/editor";
import { Avatar } from "@plane/ui";
//store
import { useUser, useMember } from "@/hooks/store";
import { usePlatformOS } from "@/hooks/use-platform-os";

interface Props {
  className? : string;
  optionsClassName?: string;
  projectId?: string;
  referenceElement: HTMLButtonElement | null;
  placement: Placement | undefined;
  isOpen: boolean;
}

export const MemberOptions = observer((props: Props) => {
  const { projectId, referenceElement, placement, isOpen, optionsClassName="" } = props;
  // states
  const [query, setQuery] = useState("");
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  // refs
  const inputRef = useRef<HTMLInputElement | null>(null);
  // store hooks
  const { workspaceSlug } = useParams();
  const {
    getUserDetails,
    project: { getProjectMemberIds, fetchProjectMembers },
    workspace: { workspaceMemberIds },
  } = useMember();
  const { data: currentUser } = useUser();
  const { isMobile } = usePlatformOS();
  // popper-js init
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
    if (isOpen) {
      onOpen();
      if (!isMobile) {
        inputRef.current && inputRef.current.focus();
      }
    }
  }, [isOpen, isMobile]);

  const memberIds = projectId ? getProjectMemberIds(projectId) : workspaceMemberIds;
  const onOpen = () => {
    if (!memberIds && workspaceSlug && projectId) fetchProjectMembers(workspaceSlug.toString(), projectId);
  };

  const searchInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (query !== "" && e.key === "Escape") {
      e.stopPropagation();
      setQuery("");
    }
  };

  const options = memberIds?.map((userId) => {
    const userDetails = getUserDetails(userId);

    return {
      value: userId,
      query: `${userDetails?.display_name} ${userDetails?.first_name} ${userDetails?.last_name}`,
      content: (
        <div className="flex items-center gap-2">
          <Avatar name={userDetails?.display_name} src={userDetails?.avatar} />
          <span className="flex-grow truncate">{currentUser?.id === userId ? "You" : userDetails?.display_name}</span>
        </div>
      ),
    };
  });

  const filteredOptions =
    query === "" ? options : options?.filter((o) => o.query.toLowerCase().includes(query.toLowerCase()));

  return createPortal(
    <Combobox.Options data-prevent-outside-click static>
      <div
        className={cn("my-1 w-48 rounded border-[0.5px] border-custom-border-300 bg-custom-background-100 px-2 py-2.5 text-xs shadow-custom-shadow-rg focus:outline-none z-20",
          optionsClassName)}
        ref={setPopperElement}
        style={{
          ...styles.popper,
        }}
        {...attributes.popper}
      >
        <div className="flex items-center gap-1.5 rounded border border-custom-border-100 bg-custom-background-90 px-2">
          <Search className="h-3.5 w-3.5 text-custom-text-400" strokeWidth={1.5} />
          <Combobox.Input
            as="input"
            ref={inputRef}
            className="w-full bg-transparent py-1 text-xs text-custom-text-200 placeholder:text-custom-text-400 focus:outline-none"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            displayValue={(assigned: any) => assigned?.name}
            onKeyDown={searchInputKeyDown}
          />
        </div>
        <div className="mt-2 max-h-48 space-y-1 overflow-y-scroll">
          {filteredOptions ? (
            filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <Combobox.Option
                  key={option.value}
                  value={option.value}
                  className={({ active, selected }) =>
                    `flex w-full cursor-pointer select-none items-center justify-between gap-2 truncate rounded px-1 py-1.5 ${
                      active ? "bg-custom-background-80" : ""
                    } ${selected ? "text-custom-text-100" : "text-custom-text-200"}`
                  }
                >
                  {({ selected }) => (
                    <>
                      <span className="flex-grow truncate">{option.content}</span>
                      {selected && <Check className="h-3.5 w-3.5 flex-shrink-0" />}
                    </>
                  )}
                </Combobox.Option>
              ))
            ) : (
              <p className="px-1.5 py-1 italic text-custom-text-400">No matching results</p>
            )
          ) : (
            <p className="px-1.5 py-1 italic text-custom-text-400">Loading...</p>
          )}
        </div>
      </div>
    </Combobox.Options>,
    document.body
  );
});
