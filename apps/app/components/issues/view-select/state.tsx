import { useRouter } from "next/router";

import useSWR from "swr";

// services
import stateService from "services/state.service";
// ui
import { CustomSelect } from "components/ui";
// helpers
import { addSpaceIfCamelCase } from "helpers/string.helper";
import { getStatesList } from "helpers/state.helper";
// types
import { IIssue } from "types";
// fetch-keys
import { STATE_LIST } from "constants/fetch-keys";

type Props = {
  issue: IIssue;
  partialUpdateIssue: (formData: Partial<IIssue>) => void;
  position?: "left" | "right";
  isNotAllowed: boolean;
};

export const ViewStateSelect: React.FC<Props> = ({
  issue,
  partialUpdateIssue,
  position,
  isNotAllowed,
}) => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { data: stateGroups } = useSWR(
    workspaceSlug && projectId ? STATE_LIST(issue.project) : null,
    workspaceSlug ? () => stateService.getStates(workspaceSlug as string, issue.project) : null
  );
  const states = getStatesList(stateGroups ?? {});

  return (
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
};
