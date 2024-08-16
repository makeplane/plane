import { observer } from "mobx-react";
// ui
import { CustomSearchSelect, Loader } from "@plane/ui";
// plane web types
import { IssueTypeLogo } from "@/plane-web/components/issue-types";
// plane web hooks
import { useIssueTypes } from "@/plane-web/hooks/store";

type TIssueTypeDropdownProps = {
  issueTypeId: string | null;
  projectId: string;
  disabled?: boolean;
  handleIssueTypeChange: (value: string) => void;
};

export const IssueTypeDropdown = observer((props: TIssueTypeDropdownProps) => {
  const { issueTypeId, projectId, disabled = false, handleIssueTypeChange } = props;
  // store hooks
  const { loader: issueTypesLoader, getProjectIssueTypes } = useIssueTypes();
  // derived values
  const issueTypes = getProjectIssueTypes(projectId, true);

  // Can be used with CustomSearchSelect as well
  const issueTypeOptions = Object.entries(issueTypes).map(([issueTypeId, issueTypeDetail]) => ({
    value: issueTypeId,
    query: issueTypeDetail.name ?? "",
    content: (
      <div className="flex w-full gap-2 items-center">
        <IssueTypeLogo
          icon_props={issueTypeDetail?.logo_props?.icon}
          size={14}
          containerSize={20}
          isDefault={issueTypeDetail?.is_default}
        />
        <div className="text-sm font-medium text-custom-text-200 truncate">{issueTypeDetail.name}</div>
      </div>
    ),
  }));

  if (!issueTypeId || issueTypesLoader === "init-loader") {
    return (
      <Loader className="w-16 h-full">
        <Loader.Item height="100%" />
      </Loader>
    );
  }

  return (
    <CustomSearchSelect
      value={issueTypeId}
      label={
        <div className="flex w-full gap-2 items-center max-w-44">
          <IssueTypeLogo
            icon_props={issueTypes[issueTypeId]?.logo_props?.icon}
            size={14}
            containerSize={20}
            isDefault={issueTypes[issueTypeId]?.is_default}
          />
          <div className="text-sm font-medium text-custom-text-200 truncate">{issueTypes[issueTypeId]?.name}</div>
        </div>
      }
      options={issueTypeOptions}
      onChange={handleIssueTypeChange}
      className="w-full h-full flex"
      optionsClassName="w-44 space-y-1.5"
      buttonClassName="rounded text-sm py-0.5 bg-custom-background-100 border-[0.5px] border-custom-border-300"
      disabled={disabled}
      noChevron
    />
  );
});
