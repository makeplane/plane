import { FC } from "react";
import { observer } from "mobx-react-lite";
// components
import { HeaderGroupByCard } from "./group-by-card";
import { EProjectStore } from "store/command-palette.store";

export interface ILabelHeader {
  column_id: string;
  column_value: any;
  issues_count: number;
  disableIssueCreation?: boolean;
  currentStore: EProjectStore;
}

const Icon = ({ color }: any) => (
  <div className="w-[12px] h-[12px] rounded-full" style={{ backgroundColor: color ? color : "#666" }} />
);

export const LabelHeader: FC<ILabelHeader> = observer((props) => {
  const { column_value, issues_count, disableIssueCreation, currentStore } = props;

  const label = column_value ?? null;

  return (
    <>
      {column_value && (
        <HeaderGroupByCard
          icon={<Icon color={label?.color || null} />}
          title={column_value?.name || ""}
          count={issues_count}
          issuePayload={{ labels: [label.id] }}
          disableIssueCreation={disableIssueCreation}
          currentStore={currentStore}
        />
      )}
    </>
  );
});
