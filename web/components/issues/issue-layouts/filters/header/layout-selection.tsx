import React from "react";
// ui
import { IconTabs } from "@plane/ui";
// types
import { TIssueLayouts } from "@plane/types";
// constants
import { ISSUE_LAYOUTS } from "constants/issue";

type Props = {
  layouts: TIssueLayouts[];
  onChange: (layout: TIssueLayouts) => void;
  selectedLayout: TIssueLayouts | undefined;
};

export const LayoutSelection: React.FC<Props> = (props) => {
  const { layouts, onChange, selectedLayout } = props;

  return (
    <IconTabs
      iconsList={ISSUE_LAYOUTS.filter((l) => layouts.includes(l.key))}
      onSelect={(key) => onChange(key as TIssueLayouts)}
      selectedKey={selectedLayout}
    />
  );
};
