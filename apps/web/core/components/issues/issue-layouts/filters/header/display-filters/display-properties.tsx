import React from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane constants
import { ISSUE_DISPLAY_PROPERTIES } from "@plane/constants";
// plane i18n
import { useTranslation } from "@plane/i18n";
// types
import { IIssueDisplayProperties } from "@plane/types";
// plane web helpers
import { shouldRenderDisplayProperty } from "@/plane-web/helpers/issue-filter.helper";
// components
import { FilterHeader } from "../helpers/filter-header";

type Props = {
  displayProperties: IIssueDisplayProperties;
  displayPropertiesToRender: (keyof IIssueDisplayProperties)[];
  handleUpdate: (updatedDisplayProperties: Partial<IIssueDisplayProperties>) => void;
  cycleViewDisabled?: boolean;
  moduleViewDisabled?: boolean;
  isEpic?: boolean;
};

export const FilterDisplayProperties: React.FC<Props> = observer((props) => {
  const {
    displayProperties,
    displayPropertiesToRender,
    handleUpdate,
    cycleViewDisabled = false,
    moduleViewDisabled = false,
    isEpic = false,
  } = props;
  // hooks
  const { t } = useTranslation();
  // router
  const { workspaceSlug, projectId: routerProjectId } = useParams();
  // states
  const [previewEnabled, setPreviewEnabled] = React.useState(true);
  // derived values
  const projectId = !!routerProjectId ? routerProjectId?.toString() : undefined;

  // Filter out "cycle" and "module" keys if cycleViewDisabled or moduleViewDisabled is true
  // Also filter out display properties that should not be rendered
  const filteredDisplayProperties = ISSUE_DISPLAY_PROPERTIES.filter((property) => {
    if (!displayPropertiesToRender.includes(property.key)) return false;
    switch (property.key) {
      case "cycle":
        return !cycleViewDisabled;
      case "modules":
        return !moduleViewDisabled;
      default:
        return shouldRenderDisplayProperty({ workspaceSlug: workspaceSlug?.toString(), projectId, key: property.key });
    }
  }).map((property) => {
    if (isEpic && property.key === "sub_issue_count") {
      return { ...property, titleTranslationKey: "issue.display.properties.work_item_count" };
    }
    return property;
  });

  return (
    <>
      <FilterHeader
        title={t("issue.display.properties.label")}
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
                {t(displayProperty.titleTranslationKey)}
              </button>
            </>
          ))}
        </div>
      )}
    </>
  );
});
