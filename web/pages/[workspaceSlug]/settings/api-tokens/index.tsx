// react
import React from "react";
// next
import type { NextPage } from "next";
import { useRouter } from "next/router";
import Link from "next/link";
// layouts
import { AppLayout } from "layouts/app-layout";
import { WorkspaceSettingLayout } from "layouts/settings-layout";
// component
import { WorkspaceSettingHeader } from "components/headers";
import ApiTokenEmptyState from "components/api-token/empty-state";
// ui
import { Spinner, Button } from "@plane/ui";
// services
import { ApiTokenService } from "services/api_token.service";
// constants
import { API_TOKENS_LIST } from "constants/fetch-keys";
// helpers
import { formatLongDateDistance, timeAgo } from "helpers/date-time.helper";
// swr
import useSWR from "swr";
// icons
import { XCircle } from "lucide-react";


const apiTokenService = new ApiTokenService();
const Api: NextPage = () => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { data: tokens, isLoading } = useSWR(workspaceSlug ? API_TOKENS_LIST(workspaceSlug.toString()) : null, () =>
    workspaceSlug ? apiTokenService.getApiTokens(workspaceSlug.toString()) : null
  );

  return (
    <AppLayout header={<WorkspaceSettingHeader title="Api Tokens" />}>
      <WorkspaceSettingLayout>
        {!isLoading ? (
          tokens && tokens.length > 0 ? (
            <section className="pr-9 py-8 w-full overflow-y-auto">
              <div className="flex items-center justify-between py-3.5 border-b border-custom-border-200 mb-2">
                <h3 className="text-xl font-medium">Api Tokens</h3>
                <Button
                  variant="primary"
                  onClick={() => {
                    router.push(`${router.asPath}/create/`);
                  }}
                >
                  Add Api Token
                </Button>
              </div>
              <div>
                {tokens?.map((token) => (
                  <Link href={`/${workspaceSlug}/settings/api-tokens/${token.id}`} key={token.id}>
                    <div className="border-b flex flex-col relative justify-center items-start border-custom-border-200 py-5 hover:cursor-pointer">
                      <XCircle className="absolute right-5 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto justify-self-center stroke-custom-text-400 h-[15px] w-[15px]" />
                      <div className="flex items-center px-4">
                        <span className="text-sm font-medium leading-6">{token.label}</span>
                        <span
                          className={`${
                            token.is_active
                              ? "bg-green-600/10 text-green-600"
                              : "bg-custom-text-400/20 text-custom-text-400"
                          }  flex items-center px-2 h-4 rounded-sm max-h-fit ml-2 text-xs font-medium`}
                        >
                          {token.is_active ? "Active" : "Expired"}
                        </span>
                      </div>
                      <div className="flex items-center px-4">
                        {token.description.length != 0 && (
                          <p className="text-sm mb-1 mr-3 font-medium leading-6">{token.description}</p>
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
                ))}
              </div>
            </section>
          ) : (
            <div className="mx-auto py-8">
              <ApiTokenEmptyState />
            </div>
          )
        ) : (
          <div className="flex justify-center pr-9 py-8  w-full min-h-full items-center">
            <Spinner />
          </div>
        )}
      </WorkspaceSettingLayout>
    </AppLayout>
  );
};
export default Api;
