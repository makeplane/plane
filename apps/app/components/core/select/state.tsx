// ui
import { CustomSelect } from "components/ui";
// helpers
import { addSpaceIfCamelCase } from "helpers/string.helper";
// types
import { IIssue, IState } from "types";

type Props = {
  issue: IIssue;
  states: IState[] | undefined;
  partialUpdateIssue: (formData: Partial<IIssue>) => void;
  isNotAllowed: boolean;
};

export const StateSelect: React.FC<Props> = ({
  issue,
  states,
  partialUpdateIssue,
  isNotAllowed,
}) => (
  <CustomSelect
    label={
      <>
        <span
          className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
          style={{
            backgroundColor: states?.find((s) => s.id === issue.state)?.color,
          }}
        />
        {addSpaceIfCamelCase(states?.find((s) => s.id === issue.state)?.name ?? "")}
      </>
    }
    value={issue.state}
    onChange={(data: string) => {
      partialUpdateIssue({ state: data });
    }}
    maxHeight="md"
    noChevron
    disabled={isNotAllowed}
  >
    {states?.map((state) => (
      <CustomSelect.Option key={state.id} value={state.id}>
        <>
          <span
            className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
            style={{
              backgroundColor: state.color,
            }}
          />
          {addSpaceIfCamelCase(state.name)}
        </>
      </CustomSelect.Option>
    ))}
  </CustomSelect>
);
