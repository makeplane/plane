import { useRef, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { v4 } from "uuid";
import { InfoIcon, Plus } from "lucide-react";
// ui
import { Button, Loader, Tooltip } from "@plane/ui";
// plane web components
import { IssuePropertyList, IssueTypePropertiesEmptyState } from "@/plane-web/components/issue-types";
// plane web hooks
import { useIssueType, useIssueTypes } from "@/plane-web/hooks/store";
// plane web types
import { EIssuePropertyType, TIssueProperty, TCreationListModes } from "@/plane-web/types";

type TIssuePropertiesRoot = {
  issueTypeId: string;
};

export type TIssuePropertyCreateList = Partial<TIssueProperty<EIssuePropertyType>> & {
  key: string;
};

const defaultIssueProperty: Partial<TIssueProperty<EIssuePropertyType>> = {
  id: undefined,
  display_name: "",
  property_type: undefined,
  relation_type: undefined,
  is_multi: false,
  is_active: false,
  is_required: false,
};

export const IssuePropertiesRoot = observer((props: TIssuePropertiesRoot) => {
  const { issueTypeId } = props;
  // router
  const { projectId } = useParams();
  // states
  const [issuePropertyCreateList, setIssuePropertyCreateList] = useState<TIssuePropertyCreateList[]>([]);
  // store hooks
  const { getProjectIssuePropertiesLoader } = useIssueTypes();
  const issueType = useIssueType(issueTypeId);
  // derived values
  const issuePropertiesLoader = getProjectIssuePropertiesLoader(projectId?.toString());
  const properties = issueType?.properties;
  // refs
  const containerRef = useRef<HTMLDivElement>(null);
  const lastElementRef = useRef<HTMLDivElement>(null);

  const scrollIntoElementView = () => {
    if (lastElementRef.current) {
      lastElementRef.current.scrollIntoView({ behavior: "auto", block: "nearest", inline: "start" });
      const propertyTitleDropdownElement = lastElementRef.current.querySelector(
        "button.property-title-dropdown"
      ) as HTMLButtonElement | null;
      setTimeout(() => {
        propertyTitleDropdownElement?.focus();
        propertyTitleDropdownElement?.click();
      }, 50);
    }
  };

  // handlers
  const handleIssuePropertyCreateList = (mode: TCreationListModes, value: TIssuePropertyCreateList) => {
    switch (mode) {
      case "add":
        setIssuePropertyCreateList((prevValue) => {
          prevValue = prevValue ? [...prevValue] : [];
          return [...prevValue, value];
        });
        break;
      case "remove":
        setIssuePropertyCreateList((prevValue) => {
          prevValue = prevValue ? [...prevValue] : [];
          return prevValue.filter((item) => item.key !== value.key);
        });
        break;
      default:
        break;
    }
  };

  return (
    <div className="bg-custom-background-100 border border-custom-border-200 rounded-lg">
      <div className="pt-4">
        <div className="w-full flex gap-2 items-center px-6">
          <div className="text-base font-semibold">Custom Properties</div>
          <Tooltip
            position="right"
            tooltipContent="Each issue type comes with a default set of properties like Title, Description, Assignee, State, Priority, Start date, Due date, Module, Cycle etc. You can also customize and add your own properties to tailor it to your team's needs."
          >
            <InfoIcon className="size-3.5 text-custom-text-200 cursor-help" />
          </Tooltip>
        </div>
        {issuePropertiesLoader === "init-loader" ? (
          <Loader className="w-full space-y-4 p-6">
            <Loader.Item height="30px" width="100%" />
            <Loader.Item height="30px" width="100%" />
            <Loader.Item height="30px" width="100%" />
            <Loader.Item height="30px" width="100%" />
          </Loader>
        ) : (properties && properties?.length > 0) || issuePropertyCreateList.length > 0 ? (
          <IssuePropertyList
            issueTypeId={issueTypeId}
            issuePropertyCreateList={issuePropertyCreateList}
            handleIssuePropertyCreateList={handleIssuePropertyCreateList}
            containerRef={containerRef}
            lastElementRef={lastElementRef}
          />
        ) : (
          <IssueTypePropertiesEmptyState />
        )}
      </div>
      <div className="flex justify-between items-center py-3 px-6 border-t border-custom-border-200">
        <Button
          variant="accent-primary"
          size="sm"
          onClick={() => {
            handleIssuePropertyCreateList("add", {
              key: v4(),
              ...defaultIssueProperty,
            });
            setTimeout(() => {
              scrollIntoElementView();
            }, 0);
          }}
        >
          <Plus className="h-3.5 w-3.5" />
          Add new property
        </Button>
      </div>
    </div>
  );
});
