import type { NextPage } from "next";
import { useRouter } from "next/router";
import useSWR from "swr";
import { observer } from "mobx-react-lite";
// layout
import { AppLayout } from "layouts/app-layout";
import { WorkspaceSettingLayout } from "layouts/setting-layout";
// components
import { WorkspaceSettingHeader } from "components/headers";
import { WebhookDetails } from "components/web-hooks";
// hooks
import { useMobxStore } from "lib/mobx/store-provider";
// types
import { RootStore } from "store/root";
import { IExtendedWebhook, IWebhook } from "types";

const Webhooks: NextPage = observer(() => {
  const router = useRouter();
  const { workspaceSlug, webhookId } = router.query as { workspaceSlug: string; webhookId: string };

  const { webhook: webhookStore }: RootStore = useMobxStore();

  const { isLoading } = useSWR(
    workspaceSlug && webhookId ? `WEBHOOKS_DETAIL_${workspaceSlug}_${webhookId}` : null,
    workspaceSlug && webhookId
      ? async () => {
          await webhookStore.fetchById(workspaceSlug, webhookId);
        }
      : null
  );

  const onSubmit = (data: IExtendedWebhook): Promise<IWebhook> => {
    const payload = {
      url: data?.url,
      is_active: data?.is_active,
      project: data?.project,
      cycle: data?.cycle,
      module: data?.module,
      issue: data?.issue,
      issue_comment: data?.issue_comment,
    };
    return webhookStore.update(workspaceSlug, webhookId, payload);
  };

  const initialPayload = webhookStore.currentWebhook as IWebhook;

  return (
    <AppLayout header={<WorkspaceSettingHeader title="Webhook Settings" />}>
      <WorkspaceSettingLayout>
        <div className="w-full overflow-y-auto py-3 pr-4">
          {isLoading ? (
            <div className="text-center py-10">Loading...</div>
          ) : (
            <WebhookDetails type="edit" initialData={initialPayload} onSubmit={onSubmit} />
          )}
        </div>
      </WorkspaceSettingLayout>
    </AppLayout>
  );
});

export default Webhooks;
