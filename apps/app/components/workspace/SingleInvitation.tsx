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
          className={`group relative flex border-2 border-transparent items-start space-x-3 cursor-pointer px-4 py-4 ${
            isChecked ? "border-theme rounded-lg" : ""
          }`}
          htmlFor={invitation.id}
        >
          <div className="flex-shrink-0">
            <span className="inline-flex items-center justify-center h-10 w-10 rounded-lg">
              {invitation.workspace.logo && invitation.workspace.logo !== "" ? (
                <Image
                  src={invitation.workspace.logo}
                  height="100%"
                  width="100%"
                  className="rounded"
                  alt={invitation.workspace.name}
                />
              ) : (
                <span className="h-full w-full p-4 flex items-center justify-center bg-gray-500 text-white rounded uppercase">
                  {invitation.workspace.name.charAt(0)}
                </span>
              )}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-gray-900">{invitation.workspace.name}</div>
            <p className="text-sm text-gray-500">
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
              className="h-4 w-4 rounded border-gray-300 text-theme focus:ring-indigo-500"
            />
          </div>
        </label>
      </li>
    </>
  );
};

export default SingleInvitation;
