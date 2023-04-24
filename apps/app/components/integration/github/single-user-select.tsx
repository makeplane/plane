import Image from "next/image";
import { useRouter } from "next/router";

import useSWR from "swr";

// services
import workspaceService from "services/workspace.service";
// ui
import { Avatar, CustomSearchSelect, CustomSelect, Input } from "components/ui";
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

export const SingleUserSelect: React.FC<Props> = ({ collaborator, index, users, setUsers }) => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { data: members } = useSWR(
    workspaceSlug ? WORKSPACE_MEMBERS(workspaceSlug.toString()) : null,
    workspaceSlug ? () => workspaceService.workspaceMembers(workspaceSlug.toString()) : null
  );

  const options =
    members?.map((member) => ({
      value: member.member.email,
      query:
        (member.member.first_name && member.member.first_name !== ""
          ? member.member.first_name
          : member.member.email) +
          " " +
          member.member.last_name ?? "",
      content: (
        <div className="flex items-center gap-2">
          <Avatar user={member.member} />
          {member.member.first_name && member.member.first_name !== ""
            ? member.member.first_name + "(" + member.member.email + ")"
            : member.member.email}
        </div>
      ),
    })) ?? [];

  return (
    <div className="grid grid-cols-3 items-center gap-2 rounded-md bg-brand-surface-2 px-2 py-3">
      <div className="flex items-center gap-2">
        <div className="relative h-8 w-8 flex-shrink-0 rounded">
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
          value={users[index].import}
          label={
            <div className="text-xs">
              {importOptions.find((o) => o.key === users[index].import)?.label}
            </div>
          }
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
          type="email"
          name={`userEmail${index}`}
          value={users[index].email}
          onChange={(e) => {
            const newUsers = [...users];
            newUsers[index].email = e.target.value;
            setUsers(newUsers);
          }}
          placeholder="Enter email of the user"
          className="py-1 text-xs"
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
