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
      <div className="group border-b border-custom-border-200 flex flex-col relative justify-center items-start py-4 hover:cursor-pointer">
        <Tooltip tooltipContent="Delete token">
          <button
            onClick={() => setDeleteModalOpen(true)}
            className="hidden group-hover:grid absolute right-5 place-items-center"
          >
            <XCircle className="h-4 w-4 text-custom-text-400 hover:text-red-500" />
          </button>
        </Tooltip>
        <div className="flex items-center px-4">
          <span className="text-sm font-medium leading-6">{token.label}</span>
          <span
            className={`${
              token.is_active ? "bg-green-500/10 text-green-500" : "bg-custom-background-80 text-custom-text-400"
            } flex items-center px-2 h-4 rounded-sm max-h-fit ml-2 text-xs font-medium`}
          >
            {token.is_active ? "Active" : "Expired"}
          </span>
        </div>
        <div className="flex items-center px-4 w-full">
          {token.description.trim() !== "" && (
            <p className="text-sm mb-1 mr-3 font-medium leading-6 truncate max-w-[50%]">{token.description}</p>
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
