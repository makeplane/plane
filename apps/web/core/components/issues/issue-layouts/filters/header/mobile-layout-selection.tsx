import { ISSUE_LAYOUTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { ChevronDownIcon } from "@plane/propel/icons";
import type { EIssueLayoutTypes } from "@plane/types";
import { CustomMenu } from "@plane/ui";
import { IssueLayoutIcon } from "../../layout-icon";

export function MobileLayoutSelection({
  layouts,
  onChange,
  activeLayout,
}: {
  layouts: EIssueLayoutTypes[];
  onChange: (layout: EIssueLayoutTypes) => void;
  activeLayout?: EIssueLayoutTypes;
  isMobile?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <CustomMenu
      maxHeight={"md"}
      className="flex flex-grow justify-center text-13 text-secondary"
      placement="bottom-start"
      customButton={
        <Button variant="secondary" className="relative px-2">
          {activeLayout && (
            <IssueLayoutIcon layout={activeLayout} size={14} strokeWidth={2} className={`h-3.5 w-3.5`} />
          )}
          <ChevronDownIcon className="size-3 text-secondary my-auto" strokeWidth={2} />
        </Button>
      }
      customButtonClassName="flex flex-grow justify-center text-secondary text-13"
      closeOnSelect
    >
      {ISSUE_LAYOUTS.filter((l) => layouts.includes(l.key)).map((layout, index) => (
        <CustomMenu.MenuItem
          key={index}
          onClick={() => {
            onChange(layout.key);
          }}
          className="flex items-center gap-2"
        >
          <IssueLayoutIcon layout={layout.key} className="h-3 w-3" />
          <div className="text-tertiary">{t(layout.i18n_label)}</div>
        </CustomMenu.MenuItem>
      ))}
    </CustomMenu>
  );
}
