import { useState } from "react";
import { CircleDot, CopyPlus, Crown, Ellipsis, LayoutPanelTop, XCircle } from "lucide-react";
// community-edition
import { BulkOperationsUpgradeToProModal } from "@plane/bulk-operations";
// ui
import { ContrastIcon, CustomSearchSelect, DiceIcon, RelatedIcon } from "@plane/ui";
// constants
import { MARKETING_PRICING_PAGE_LINK } from "@/constants/common";

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

  const options = EXTRA_PROPERTIES_LIST.map((property) => ({
    value: property.key,
    query: property.label,
    content: (
      <div className="flex items-center justify-between gap-1">
        <span className="flex items-center gap-2">
          <property.icon className="size-3.5" />
          <span className="text-sm">{property.label}</span>
        </span>
        <Crown className="size-3 text-yellow-500" />
      </div>
    ),
  }));

  return (
    <>
      <BulkOperationsUpgradeToProModal
        isOpen={isUpgradeToProModalOpen}
        onClose={() => setIsUpgradeToProModalOpen(false)}
      />
      <CustomSearchSelect
        value={null}
        onChange={() => {
          if (window.innerWidth >= 768) setIsUpgradeToProModalOpen(true);
          else window.open(MARKETING_PRICING_PAGE_LINK, "_blank");
        }}
        buttonClassName="size-6 p-0"
        label={<Ellipsis className="size-3" />}
        options={options}
        maxHeight="lg"
        optionsClassName="min-w-60"
        noChevron
      />
    </>
  );
};
