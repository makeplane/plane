import { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { v4 } from "uuid";
import { Plus } from "lucide-react";
// ui
import { Button } from "@plane/ui";
// plane web components
import { IssuePropertyList, IssueTypePropertiesEmptyState } from "@/plane-web/components/issue-types";
// plane web hooks
import { useIssueType } from "@/plane-web/hooks/store";
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
  // states
  const [issuePropertyCreateList, setIssuePropertyCreateList] = useState<TIssuePropertyCreateList[]>([]);
  // store hooks
  const issueType = useIssueType(issueTypeId);
  // derived values
  const properties = issueType?.properties;
  // refs
  const containerRef = useRef<HTMLDivElement>(null);
  const lastElementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (lastElementRef.current) {
      lastElementRef.current.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
    }
  }, [issuePropertyCreateList]);

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
      <div className="pt-6">
        <div className="w-full flex gap-2 items-center px-6">
          <div className="text-base font-semibold">Properties</div>
        </div>
        {(properties && properties?.length > 0) || issuePropertyCreateList.length > 0 ? (
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
          onClick={() =>
            handleIssuePropertyCreateList("add", {
              key: v4(),
              ...defaultIssueProperty,
            })
          }
        >
          <Plus className="h-3.5 w-3.5" />
          Add new property
        </Button>
      </div>
    </div>
  );
});
