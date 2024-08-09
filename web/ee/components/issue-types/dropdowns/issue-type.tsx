import { observer } from "mobx-react";
// ui
import { CustomSelect, Loader } from "@plane/ui";
// plane web types
import { IssueTypeLogo } from "@/plane-web/components/issue-types";
// plane web hooks
import { useIssueTypes } from "@/plane-web/hooks/store";

type TIssueTypeDropdownProps = {
  issueTypeId: string | null;
  projectId: string;
  handleIssueTypeChange: (value: string) => void;
};

export const IssueTypeDropdown = observer((props: TIssueTypeDropdownProps) => {
  const { issueTypeId, projectId, handleIssueTypeChange } = props;
  // store hooks
  const { loader: issueTypesLoader, getProjectActiveIssueTypes } = useIssueTypes();
  // derived values
  const issueTypes = getProjectActiveIssueTypes(projectId);

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
    <CustomSelect
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
      onChange={handleIssueTypeChange}
      className="w-full h-full flex"
      optionsClassName="w-44 space-y-1.5"
      buttonClassName="rounded text-sm py-0.5 bg-custom-background-100 border-[0.5px] border-custom-border-300"
      noChevron
    >
      {issueTypeOptions.map((option) => (
        <CustomSelect.Option key={option.value} value={option.value}>
          {option.content}
        </CustomSelect.Option>
      ))}
    </CustomSelect>
  );
});
