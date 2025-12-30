import { useEffect, useRef, useState } from "react";
import type { Placement } from "@popperjs/core";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { usePopper } from "react-popper";
// components
import { Combobox } from "@headlessui/react";
// i18n
import { useTranslation } from "@plane/i18n";
// icon
import { CheckIcon, CycleGroupIcon, CycleIcon, SearchIcon } from "@plane/propel/icons";
import type { TCycleGroups } from "@plane/types";
// ui
// store hooks
import { useCycle } from "@/hooks/store/use-cycle";
import { usePlatformOS } from "@/hooks/use-platform-os";
// types

type DropdownOptions =
  | {
      value: string | null;
      query: string;
      content: React.ReactNode;
    }[]
  | undefined;

type CycleOptionsProps = {
  projectId: string;
  referenceElement: HTMLButtonElement | null;
  placement: Placement | undefined;
  isOpen: boolean;
  canRemoveCycle: boolean;
  currentCycleId?: string;
};

export const CycleOptions = observer(function CycleOptions(props: CycleOptionsProps) {
  const { projectId, isOpen, referenceElement, placement, canRemoveCycle, currentCycleId } = props;
  // i18n
  const { t } = useTranslation();
  //state hooks
  const [query, setQuery] = useState("");
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  // store hooks
  const { workspaceSlug } = useParams();
  const { getProjectCycleIds, fetchAllCycles, getCycleById } = useCycle();
  const { isMobile } = usePlatformOS();

  useEffect(() => {
    if (isOpen) {
      onOpen();
      if (!isMobile) {
        inputRef.current && inputRef.current.focus();
      }
    }
  }, [isOpen, isMobile]);

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

  const cycleIds = (getProjectCycleIds(projectId) ?? [])?.filter((cycleId) => {
    const cycleDetails = getCycleById(cycleId);
    if (currentCycleId && currentCycleId === cycleId) return false;
    return cycleDetails?.status ? (cycleDetails?.status.toLowerCase() != "completed" ? true : false) : true;
  });

  const onOpen = () => {
    if (workspaceSlug && !cycleIds) fetchAllCycles(workspaceSlug.toString(), projectId);
  };

  const searchInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (query !== "" && e.key === "Escape") {
      e.stopPropagation();
      setQuery("");
    }
  };

  const options: DropdownOptions = cycleIds?.map((cycleId) => {
    const cycleDetails = getCycleById(cycleId);
    const cycleStatus = cycleDetails?.status ? (cycleDetails.status.toLocaleLowerCase() as TCycleGroups) : "draft";

    return {
      value: cycleId,
      query: `${cycleDetails?.name}`,
      content: (
        <div className="flex items-center gap-2">
          <CycleGroupIcon cycleGroup={cycleStatus} className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="flex-grow truncate">{cycleDetails?.name}</span>
        </div>
      ),
    };
  });

  if (canRemoveCycle) {
    options?.unshift({
      value: null,
      query: t("cycle.no_cycle"),
      content: (
        <div className="flex items-center gap-2">
          <CycleIcon className="h-3 w-3 flex-shrink-0" />
          <span className="flex-grow truncate">{t("cycle.no_cycle")}</span>
        </div>
      ),
    });
  }

  const filteredOptions =
    query === "" ? options : options?.filter((o) => o.query.toLowerCase().includes(query.toLowerCase()));

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
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("common.search.label")}
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
                    `flex w-full cursor-pointer select-none items-center justify-between gap-2 truncate rounded-sm px-1 py-1.5 ${
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
              <p className="px-1.5 py-1 italic text-placeholder">{t("common.search.no_matches_found")}</p>
            )
          ) : (
            <p className="px-1.5 py-1 italic text-placeholder">{t("common.loading")}</p>
          )}
        </div>
      </div>
    </Combobox.Options>
  );
});
