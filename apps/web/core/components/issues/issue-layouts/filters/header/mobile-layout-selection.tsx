import { ChevronDown } from "lucide-react";
import { ISSUE_LAYOUTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EIssueLayoutTypes } from "@plane/types";
import { Button, CustomMenu } from "@plane/ui";
import { IssueLayoutIcon } from "../../layout-icon";

export const MobileLayoutSelection = ({
  layouts,
  onChange,
  activeLayout,
}: {
  layouts: EIssueLayoutTypes[];
  onChange: (layout: EIssueLayoutTypes) => void;
  activeLayout?: EIssueLayoutTypes;
  isMobile?: boolean;
}) => {
  const { t } = useTranslation();
  return (
    <CustomMenu
      maxHeight={"md"}
      className="flex flex-grow justify-center text-sm text-custom-text-200"
      placement="bottom-start"
      customButton={
        activeLayout ? (
          <Button variant="neutral-primary" size="sm" className="relative px-2">
            <IssueLayoutIcon layout={activeLayout} size={14} strokeWidth={2} className={`h-3.5 w-3.5`} />
            <ChevronDown className="size-3 text-custom-text-200 my-auto" strokeWidth={2} />
          </Button>
        ) : (
          <div className="flex flex-start text-sm text-custom-text-200">
            {t("common.layout")}
            <ChevronDown className="ml-2  h-4 w-4 text-custom-text-200 my-auto" strokeWidth={2} />
          </div>
        )
      }
      customButtonClassName="flex flex-grow justify-center text-custom-text-200 text-sm"
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
          <div className="text-custom-text-300">{t(layout.i18n_label)}</div>
        </CustomMenu.MenuItem>
      ))}
    </CustomMenu>
  );
};
