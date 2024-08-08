import { observer } from "mobx-react";
// ui
import { CustomSearchSelect, LayersIcon, Loader, Logo } from "@plane/ui";
// plane web types
import { useIssueTypes } from "@/plane-web/hooks/store";

type TIssueTypeDropdownProps = {
  issueTypeId: string | null;
  projectId: string;
  handleIssueTypeChange: (value: string) => void;
};

export const IssueTypeDropdown = observer((props: TIssueTypeDropdownProps) => {
  const { issueTypeId, projectId, handleIssueTypeChange } = props;
  // store hooks
  const { getProjectIssueTypeLoader, getProjectActiveIssueTypes } = useIssueTypes();
  // derived values
  const issueTypeLoader = getProjectIssueTypeLoader(projectId);
  const issueTypes = getProjectActiveIssueTypes(projectId);

  const issuePropertyTypeOptions = Object.entries(issueTypes).map(([issueTypeId, issueTypeDetail]) => ({
    value: issueTypeId,
    query: issueTypeDetail.name ?? "",
    content: (
      <div className="flex gap-2 items-center">
        <div className="flex-shrink-0 grid h-5 w-5 place-items-center rounded bg-custom-background-80">
          {issueTypeDetail?.logo_props?.in_use ? (
            <Logo logo={issueTypeDetail.logo_props} size={12} type="lucide" />
          ) : (
            <LayersIcon className="h-3 w-3 text-custom-text-300" />
          )}
        </div>
        <div className="text-sm font-medium text-custom-text-200">{issueTypeDetail.name}</div>
      </div>
    ),
  }));

  if (!issueTypeId || issueTypeLoader === "init-loader") {
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
        <div className="flex gap-1 items-center">
          <div className="flex-shrink-0 grid h-4 w-4 place-items-center">
            {issueTypes[issueTypeId]?.logo_props?.in_use ? (
              <Logo logo={issueTypes[issueTypeId].logo_props} size={12} type="lucide" />
            ) : (
              <LayersIcon className="h-3 w-3 text-custom-text-300" />
            )}
          </div>
          <div className="text-sm font-medium text-custom-text-200">{issueTypes[issueTypeId]?.name}</div>
        </div>
      }
      options={issuePropertyTypeOptions}
      onChange={handleIssueTypeChange}
      className="w-full h-full flex"
      optionsClassName="w-48"
      buttonClassName="rounded text-sm py-0.5 bg-custom-background-100 border-[0.5px] border-custom-border-300"
      noChevron
    />
  );
});
