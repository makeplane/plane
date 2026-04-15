import { Building2 } from "lucide-react";
import useSWR from "swr";
import { getButtonStyling } from "@plane/propel/button";
import { ChevronDownIcon } from "@plane/propel/icons";
import { CustomSearchSelect } from "@plane/ui";
import { cn } from "@plane/utils";
import { useTranslation } from "@plane/i18n";
import { HoIssueService } from "@/plane-web/services/ho-issue.service";

const hoIssueService = new HoIssueService();

type Props = {
  value: string;
  onChange: (slug: string) => void;
};

export const BankWideWorkspaceSelect = function BankWideWorkspaceSelect({ value, onChange }: Props) {
  const { t } = useTranslation();

  const { data: workspaces = [] } = useSWR("HO_ACCESSIBLE_WORKSPACES", () => hoIssueService.listAccessibleWorkspaces());

  const options = [
    {
      value: "",
      query: t("ho.all_workspaces"),
      content: (
        <div className="flex items-center gap-2 max-w-[250px]">
          <Building2 className="h-4 w-4 flex-shrink-0 text-custom-text-300" />
          <span className="truncate text-custom-text-300">{t("ho.all_workspaces")}</span>
        </div>
      ),
    },
    ...workspaces.map((ws) => ({
      value: ws.slug,
      query: ws.department_name,
      content: (
        <div className="flex items-center gap-2 max-w-[250px]">
          <Building2 className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">{ws.department_name}</span>
        </div>
      ),
    })),
  ];

  const selectedName = value ? workspaces.find((w) => w.slug === value)?.department_name : null;

  return (
    <CustomSearchSelect
      value={value}
      onChange={(val: string) => onChange(val)}
      options={options}
      className="border-none p-0"
      customButton={
        <div className={cn(getButtonStyling("secondary", "lg"), "gap-2")}>
          <Building2 className="h-4 w-4" />
          {selectedName ?? t("ho.all_workspaces")}
          <ChevronDownIcon className="h-3 w-3" aria-hidden="true" />
        </div>
      }
      customButtonClassName="border-none p-0 bg-transparent hover:bg-transparent w-auto h-auto"
    />
  );
};
