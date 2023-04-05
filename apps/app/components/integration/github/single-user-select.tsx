import Image from "next/image";
import { useRouter } from "next/router";

import useSWR from "swr";

// services
import workspaceService from "services/workspace.service";
// ui
import { CustomSelect } from "components/ui";
// types
import { IGithubRepoCollaborator } from "types";
// fetch-keys
import { WORKSPACE_MEMBERS } from "constants/fetch-keys";
import { UseFormSetValue, UseFormWatch } from "react-hook-form";
import { TFormValues } from "./root";

type Props = {
  collaborator: IGithubRepoCollaborator;
  index: number;
  watch: UseFormWatch<TFormValues>;
  setValue: UseFormSetValue<TFormValues>;
};

const importOptions = [
  {
    key: "map",
    label: "Map to existing",
  },
  {
    key: "invite",
    label: "Invite by email",
  },
  {
    key: false,
    label: "Do not import",
  },
];

export const SingleUserSelect: React.FC<Props> = ({ collaborator, index, watch, setValue }) => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { data: members } = useSWR(
    workspaceSlug ? WORKSPACE_MEMBERS(workspaceSlug as string) : null,
    workspaceSlug ? () => workspaceService.workspaceMembers(workspaceSlug as string) : null
  );

  const usersList = watch("users");

  return (
    <div className="bg-gray-50 p-2 rounded-md grid grid-cols-3 items-center gap-2">
      <div className="flex items-center gap-2">
        <div className="relative h-8 w-8 rounded flex-shrink-0">
          <Image
            src={collaborator.avatar_url}
            layout="fill"
            objectFit="cover"
            className="rounded"
            alt={`${collaborator.login} GitHub user`}
          />
        </div>
        <p className="text-sm">{collaborator.login}</p>
      </div>
      <div>
        <CustomSelect
          value={usersList[index].import}
          label={
            <div className="text-xs">
              {/* {importOptions.find((o) => o.key === usersList[index].import).label} */}
            </div>
          }
          onChange={(val: any) => console.log(val)}
          noChevron
        >
          {importOptions.map((option) => (
            <CustomSelect.Option key={option.label} value={option.key}>
              <div>{option.label}</div>
            </CustomSelect.Option>
          ))}
        </CustomSelect>
      </div>
    </div>
  );
};
