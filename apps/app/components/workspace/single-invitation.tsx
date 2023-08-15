// helpers
import { getFirstCharacters, truncateText } from "helpers/string.helper";
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
}) => (
  <li>
    <label
      className={`group relative flex cursor-pointer items-start space-x-3 border-2 border-transparent py-4`}
      htmlFor={invitation.id}
    >
      <div className="flex-shrink-0">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg">
          {invitation.workspace.logo && invitation.workspace.logo !== "" ? (
            <img
              src={invitation.workspace.logo}
              height="100%"
              width="100%"
              className="rounded"
              alt={invitation.workspace.name}
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center rounded-xl bg-gray-700 p-4 uppercase text-white">
              {getFirstCharacters(invitation.workspace.name)}
            </span>
          )}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium">{truncateText(invitation.workspace.name, 30)}</div>
        <p className="text-sm text-custom-text-200">
          Invited by{" "}
          {invitation.created_by_detail
            ? invitation.created_by_detail.display_name
            : invitation.workspace.owner.display_name}
        </p>
      </div>
      <div className="flex-shrink-0 self-center">
        <button
          className={`${
            invitationsRespond.includes(invitation.id)
              ? "bg-custom-background-80 text-custom-text-200"
              : "bg-custom-primary text-white"
          } text-sm px-4 py-2 border border-custom-border-200 rounded-3xl`}
          onClick={(e) => {
            handleInvitation(
              invitation,
              invitationsRespond.includes(invitation.id) ? "withdraw" : "accepted"
            );
          }}
        >
          {invitationsRespond.includes(invitation.id) ? "Invitation Accepted" : "Accept Invitation"}
        </button>
      </div>
    </label>
  </li>
);

export default SingleInvitation;
