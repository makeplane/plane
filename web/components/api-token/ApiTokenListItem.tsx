import Link from "next/link";
// helpers
import { formatLongDateDistance, timeAgo } from "helpers/date-time.helper";
// icons
import { XCircle } from "lucide-react";
import { IApiToken } from "types/api_token";

interface IApiTokenListItem {
  workspaceSlug: string | string[] | undefined;
  token: IApiToken;
}

export const ApiTokenListItem = ({ token, workspaceSlug }: IApiTokenListItem) => (
  <Link href={`/${workspaceSlug}/settings/api-tokens/${token.id}`} key={token.id}>
    <div className="border-b flex flex-col relative justify-center items-start border-custom-border-200 py-5 hover:cursor-pointer">
      <XCircle className="absolute right-5 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto justify-self-center stroke-custom-text-400 h-[15px] w-[15px]" />
      <div className="flex items-center px-4">
        <span className="text-sm font-medium leading-6">{token.label}</span>
        <span
          className={`${
            token.is_active ? "bg-green-600/10 text-green-600" : "bg-custom-text-400/20 text-custom-text-400"
          }  flex items-center px-2 h-4 rounded-sm max-h-fit ml-2 text-xs font-medium`}
        >
          {token.is_active ? "Active" : "Expired"}
        </span>
      </div>
      <div className="flex items-center px-4 w-full">
        {token.description.length != 0 && (
          <p className="text-sm mb-1 mr-3 font-medium leading-6 truncate max-w-[50%]">{token.description}</p>
        )}
        {
          <p className="text-xs mb-1 leading-6 text-custom-text-400">
            {token.is_active
              ? token.expired_at === null
                ? "Never Expires"
                : `Expires in ${formatLongDateDistance(token.expired_at!)}`
              : timeAgo(token.expired_at)}
          </p>
        }
      </div>
    </div>
  </Link>
);
