import React from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// types
import { IIssueDisplayProperties } from "@plane/types";
// constants
import { ISSUE_DISPLAY_PROPERTIES } from "@/constants/issue";
// plane web helpers
import { shouldRenderDisplayProperty } from "@/plane-web/helpers/issue-filter.helper";
// components
import { FilterHeader } from "../helpers/filter-header";
import { useTranslation } from "@plane/i18n";
import { useUserPermissions } from "@/hooks/store";

type Props = {
  displayProperties: IIssueDisplayProperties;
  displayPropertiesToRender: (keyof IIssueDisplayProperties)[];
  handleUpdate: (updatedDisplayProperties: Partial<IIssueDisplayProperties>) => void;
  cycleViewDisabled?: boolean;
  moduleViewDisabled?: boolean;
};

type IProperty = {
  key: keyof IIssueDisplayProperties | string;
  title: string;
};

export const FilterDisplayProperties: React.FC<Props> = observer((props) => {
  const {
    displayProperties,
    displayPropertiesToRender,
    handleUpdate,
    cycleViewDisabled = false,
    moduleViewDisabled = false,
  } = props;
  const { t } = useTranslation();
  // router
  const { workspaceSlug, projectId: routerProjectId } = useParams();
  // states
  const [previewEnabled, setPreviewEnabled] = React.useState(true);
  // derived values
  const projectId = !!routerProjectId ? routerProjectId?.toString() : undefined;
  const { workspaceUserInfo } = useUserPermissions();

  const customPropertiesForDisplay: IProperty[] = Object.keys(
    workspaceUserInfo[workspaceSlug?.toString()]?.default_props?.display_properties?.custom_properties || {}
  ).map((key) => ({
    key,
    title: key,
  }));

  const combinedPropertiesForDisplay: IProperty[] = [
    ...ISSUE_DISPLAY_PROPERTIES,
    ...customPropertiesForDisplay
  ];

  // Filter out "cycle" and "module" keys if cycleViewDisabled or moduleViewDisabled is true
  // Also filter out display properties that should not be rendered
  const filteredDisplayProperties = combinedPropertiesForDisplay.filter((property) => {
    if (customPropertiesForDisplay.some((customProperty) => customProperty.key === property.key)) {
      return true;
    }
    if (!displayPropertiesToRender.includes(property.key)) return false;
    switch (property.key) {
      case "cycle":
        return !cycleViewDisabled;
      case "modules":
        return !moduleViewDisabled;
      default:
        return shouldRenderDisplayProperty({ workspaceSlug: workspaceSlug?.toString(), projectId, key: property.key });
    }
  });

  return (
    <>
      <FilterHeader
        title="Display Properties"
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled && (
        <div className="mt-1 flex flex-wrap items-center gap-2">
          {filteredDisplayProperties.map((displayProperty) => (
            <>
              <button
                key={displayProperty.key}
                type="button"
                className={`rounded border px-2 py-0.5 text-xs transition-all ${
                  displayProperties?.[displayProperty.key]
                    ? "border-custom-primary-100 bg-custom-primary-100 text-white"
                    : "border-custom-border-200 hover:bg-custom-background-80"
                }`}
                onClick={() =>
                  handleUpdate({
                    [displayProperty.key]: !displayProperties?.[displayProperty.key],
                  })
                }
              >
                {t(displayProperty.key as string)}
              </button>
            </>
          ))}
        </div>
      )}
    </>
  );
});
