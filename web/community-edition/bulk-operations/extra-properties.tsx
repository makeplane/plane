import React, { useState } from "react";
import { usePopper } from "react-popper";
import { CircleDot, CopyPlus, Crown, Ellipsis, LayoutPanelTop, Search, XCircle } from "lucide-react";
import { Combobox } from "@headlessui/react";
// community-edition
import { BulkOperationsUpgradeToProModal } from "@plane/bulk-operations";
// ui
import { ContrastIcon, DiceIcon, RelatedIcon } from "@plane/ui";
// constants
import { MARKETING_PRICING_PAGE_LINK } from "@/constants/common";
// helpers
import { cn } from "@/helpers/common.helper";

const EXTRA_PROPERTIES_LIST = [
  {
    key: "cycle",
    label: "Cycle",
    icon: ContrastIcon,
  },
  {
    key: "modules",
    label: "Modules",
    icon: DiceIcon,
  },
  {
    key: "add-parent",
    label: "Add parent",
    icon: LayoutPanelTop,
  },
  {
    key: "blocking",
    label: "Blocking",
    icon: XCircle,
  },
  {
    key: "blocked-by",
    label: "Blocked by",
    icon: CircleDot,
  },
  {
    key: "relates-to",
    label: "Relates to",
    icon: RelatedIcon,
  },
  {
    key: "duplicate-of",
    label: "Duplicate of",
    icon: CopyPlus,
  },
];

export const BulkOperationsExtraProperties = () => {
  // states
  const [isUpgradeToProModalOpen, setIsUpgradeToProModalOpen] = useState(false);
  const [query, setQuery] = useState("");

  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);

  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: "bottom-start",
  });

  const options = EXTRA_PROPERTIES_LIST.map((property) => ({
    value: property.key,
    query: property.label,
    content: (
      <span className="flex items-center gap-2">
        <property.icon className="size-3.5" />
        <span className="text-sm">{property.label}</span>
      </span>
    ),
  }));

  const filteredOptions =
    query === "" ? options : options?.filter((option) => option.query.toLowerCase().includes(query.toLowerCase()));

  return (
    <>
      <BulkOperationsUpgradeToProModal
        isOpen={isUpgradeToProModalOpen}
        onClose={() => setIsUpgradeToProModalOpen(false)}
      />
      <Combobox as="div" className="relative flex-shrink-0">
        <Combobox.Button as={React.Fragment}>
          <button
            type="button"
            className="size-6 grid place-items-center border-[0.5px] border-custom-border-300 rounded hover:bg-custom-background-80"
            ref={setReferenceElement}
          >
            <Ellipsis className="size-3" />
          </button>
        </Combobox.Button>
        <Combobox.Options className="fixed z-10">
          <div
            className="my-1 overflow-y-scroll rounded-md border-[0.5px] border-custom-border-300 bg-custom-background-100 px-2 py-2.5 text-xs shadow-custom-shadow-rg focus:outline-none !min-w-60 w-60 whitespace-nowrap"
            ref={setPopperElement}
            style={styles.popper}
            {...attributes.popper}
          >
            <div className="flex items-center gap-1.5 rounded border border-custom-border-100 bg-custom-background-90 px-2">
              <Search className="h-3.5 w-3.5 text-custom-text-400" strokeWidth={1.5} />
              <Combobox.Input
                className="w-full bg-transparent py-1 text-xs text-custom-text-200 placeholder:text-custom-text-400 focus:outline-none"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search"
                displayValue={(assigned: any) => assigned?.name}
              />
            </div>
            <button
              type="button"
              className="w-full mt-2 bg-yellow-500/10 text-yellow-500 rounded flex items-center gap-2 px-1 py-1.5 outline-none"
              onClick={() => {
                if (window.innerWidth >= 768) setIsUpgradeToProModalOpen(true);
                else window.open(MARKETING_PRICING_PAGE_LINK, "_blank");
              }}
            >
              <Crown className="size-4" />
              <span className="font-medium text-sm">Unlocked in our Pro Plan</span>
            </button>
            <div className="mt-2 space-y-1 overflow-y-scroll max-h-60">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <Combobox.Option
                    key={option.value}
                    value={option.value}
                    onClick={() => {
                      if (window.innerWidth >= 768) setIsUpgradeToProModalOpen(true);
                      else window.open(MARKETING_PRICING_PAGE_LINK, "_blank");
                    }}
                    className={({ active }) =>
                      cn("w-full truncate rounded px-1 py-1.5 cursor-pointer select-none", {
                        "bg-custom-background-80": active,
                      })
                    }
                  >
                    {option.content}
                  </Combobox.Option>
                ))
              ) : (
                <p className="text-custom-text-400 italic py-1 px-1.5">No matches found</p>
              )}
            </div>
          </div>
        </Combobox.Options>
      </Combobox>
    </>
  );
};
