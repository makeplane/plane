import { FC } from "react";
import { ChevronDown, ListFilter } from "lucide-react";
// components
import { cn } from "@plane/editor";
import { useTranslation } from "@plane/i18n";
import { getButtonStyling } from "@plane/ui";
import { InboxIssueFilterSelection, InboxIssueOrderByDropdown } from "@/components/inbox/inbox-filter";
import { FiltersDropdown } from "@/components/issues";
import useSize from "@/hooks/use-window-size";

export const FiltersRoot: FC = () => {
  const { t } = useTranslation();
  const windowSize = useSize();

  const smallButton = <ListFilter className="size-3 " />;

  const largeButton = (
    <div className={cn(getButtonStyling("neutral-primary", "sm"), "px-2 text-custom-text-300")}>
      <ListFilter className="size-3 " />
      <span>{t("filters")}</span>
      <ChevronDown className="size-3" strokeWidth={2} />
    </div>
  );

  return (
    <div className="relative flex items-center gap-2">
      <div>
        <FiltersDropdown menuButton={windowSize[0] > 1280 ? largeButton : smallButton} title="" placement="bottom-end">
          <InboxIssueFilterSelection />
        </FiltersDropdown>
      </div>
      <div>
        <InboxIssueOrderByDropdown />
      </div>
    </div>
  );
};
