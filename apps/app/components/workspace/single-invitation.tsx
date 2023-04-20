// next
import Image from "next/image";
// react
import { useState } from "react";
// types
import { IWorkspaceMemberInvitation } from "types";

type Props = {
  invitation: IWorkspaceMemberInvitation;
  invitationsRespond: string[];
  handleInvitation: any;
};

const SingleInvitation: React.FC<Props> = ({
  invitation,
  invitationsRespond,
  handleInvitation,
}) => {
  const [isChecked, setIsChecked] = useState(invitationsRespond.includes(invitation.id));

  return (
    <>
      <li>
        <label
          className={`group relative flex cursor-pointer items-start space-x-3 border-2 border-transparent px-4 py-4 ${
            isChecked ? "rounded-lg border-theme" : ""
          }`}
          htmlFor={invitation.id}
        >
          <div className="flex-shrink-0">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg">
              {invitation.workspace.logo && invitation.workspace.logo !== "" ? (
                <Image
                  src={invitation.workspace.logo}
                  height="100%"
                  width="100%"
                  className="rounded"
                  alt={invitation.workspace.name}
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center rounded bg-gray-500 p-4 uppercase text-white">
                  {invitation.workspace.name.charAt(0)}
                </span>
              )}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-brand-base">{invitation.workspace.name}</div>
            <p className="text-sm text-brand-secondary">
              Invited by {invitation.workspace.owner.first_name}
            </p>
          </div>
          <div className="flex-shrink-0 self-center">
            <input
              id={invitation.id}
              aria-describedby="workspaces"
              name={invitation.id}
              checked={invitationsRespond.includes(invitation.id)}
              value={invitation.workspace.name}
              onChange={(e) => {
                handleInvitation(
                  invitation,
                  invitationsRespond.includes(invitation.id) ? "withdraw" : "accepted"
                );
                setIsChecked(e.target.checked);
              }}
              type="checkbox"
              className="h-4 w-4 rounded border-brand-base text-brand-accent focus:ring-indigo-500"
            />
          </div>
        </label>
      </li>
    </>
  );
};

export default SingleInvitation;
