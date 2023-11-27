import { useState } from "react";
import { XCircle } from "lucide-react";
// components
import { DeleteApiTokenModal } from "components/api-token";
// ui
import { Tooltip } from "@plane/ui";
// helpers
import { renderFormattedDate, timeAgo } from "helpers/date-time.helper";
// types
import { IApiToken } from "types/api_token";

type Props = {
  token: IApiToken;
};

export const ApiTokenListItem: React.FC<Props> = (props) => {
  const { token } = props;
  // states
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  return (
    <>
      <DeleteApiTokenModal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} tokenId={token.id} />
      <div className="group relative border-b border-custom-border-200 flex flex-col justify-center py-3 px-4">
        <Tooltip tooltipContent="Delete token">
          <button
            onClick={() => setDeleteModalOpen(true)}
            className="hidden group-hover:grid absolute right-4 place-items-center"
          >
            <XCircle className="h-4 w-4 text-red-500" />
          </button>
        </Tooltip>
        <div className="flex items-center w-4/5">
          <h5 className="text-sm font-medium truncate">{token.label}</h5>
          <span
            className={`${
              token.is_active ? "bg-green-500/10 text-green-500" : "bg-custom-background-80 text-custom-text-400"
            } flex items-center px-2 h-4 rounded-sm max-h-fit ml-2 text-xs font-medium`}
          >
            {token.is_active ? "Active" : "Expired"}
          </span>
        </div>
        <div className="flex flex-col justify-center w-full mt-1">
          {token.description.trim() !== "" && (
            <p className="text-sm mb-1 break-words max-w-[70%]">{token.description}</p>
          )}
          <p className="text-xs mb-1 leading-6 text-custom-text-400">
            {token.is_active
              ? token.expired_at
                ? `Expires ${renderFormattedDate(token.expired_at!)}`
                : "Never expires"
              : `Expired ${timeAgo(token.expired_at)}`}
          </p>
        </div>
      </div>
    </>
  );
};
