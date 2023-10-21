import { useRouter } from "next/router";

import useSWR from "swr";

// services
import { WorkspaceService } from "services/workspace.service";
// ui
import { Avatar, CustomSearchSelect, CustomSelect } from "components/ui";
import { Input } from "@plane/ui";
// types
import { IGithubRepoCollaborator } from "types";
import { IUserDetails } from "./root";
// fetch-keys
import { WORKSPACE_MEMBERS } from "constants/fetch-keys";

type Props = {
  collaborator: IGithubRepoCollaborator;
  index: number;
  users: IUserDetails[];
  setUsers: React.Dispatch<React.SetStateAction<IUserDetails[]>>;
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

// services
const workspaceService = new WorkspaceService();

export const SingleUserSelect: React.FC<Props> = ({ collaborator, index, users, setUsers }) => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { data: members } = useSWR(
    workspaceSlug ? WORKSPACE_MEMBERS(workspaceSlug.toString()) : null,
    workspaceSlug ? () => workspaceService.workspaceMembers(workspaceSlug.toString()) : null
  );

  const options = members?.map((member) => ({
    value: member.member.display_name,
    query: member.member.display_name ?? "",
    content: (
      <div className="flex items-center gap-2">
        <Avatar user={member.member} />
        {member.member.display_name}
      </div>
    ),
  }));

  return (
    <div className="grid grid-cols-3 items-center gap-2 rounded-md bg-custom-background-80 px-2 py-3">
      <div className="flex items-center gap-2">
        <div className="relative h-8 w-8 flex-shrink-0 rounded">
          <img
            src={collaborator.avatar_url}
            className="absolute top-0 left-0 h-full w-full object-cover rounded"
            alt={`${collaborator.login} GitHub user`}
          />
        </div>
        <p className="text-sm">{collaborator.login}</p>
      </div>
      <div>
        <CustomSelect
          value={users[index].import}
          label={<div className="text-xs">{importOptions.find((o) => o.key === users[index].import)?.label}</div>}
          onChange={(val: any) => {
            const newUsers = [...users];
            newUsers[index].import = val;
            newUsers[index].email = "";
            setUsers(newUsers);
          }}
          optionsClassName="w-full"
          noChevron
        >
          {importOptions.map((option) => (
            <CustomSelect.Option key={option.label} value={option.key}>
              <div>{option.label}</div>
            </CustomSelect.Option>
          ))}
        </CustomSelect>
      </div>
      {users[index].import === "invite" && (
        <Input
          id="email"
          type="email"
          name={`userEmail${index}`}
          value={users[index].email}
          onChange={(e) => {
            const newUsers = [...users];
            newUsers[index].email = e.target.value;
            setUsers(newUsers);
          }}
          placeholder="Enter email of the user"
          className="py-1 text-xs w-full"
        />
      )}
      {users[index].import === "map" && members && (
        <CustomSearchSelect
          value={users[index].email}
          label={users[index].email !== "" ? users[index].email : "Select user from project"}
          options={options}
          onChange={(val: string) => {
            const newUsers = [...users];
            newUsers[index].email = val;
            setUsers(newUsers);
          }}
          optionsClassName="w-full"
        />
      )}
    </div>
  );
};
