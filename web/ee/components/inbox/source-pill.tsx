import { useParams } from "next/navigation";
import { Zap, ListTodo, Mail } from "lucide-react";
import { EInboxIssueSource } from "@plane/constants/src/inbox";
import { TInboxSourcePill } from "@/ce/components/inbox/source-pill";
import { WithFeatureFlagHOC } from "@/plane-web/components/feature-flags";

const sourcePillMap = {
  [EInboxIssueSource.IN_APP]: {
    label: "In-app",
    icon: Zap,
  },
  [EInboxIssueSource.FORMS]: {
    label: "Forms",
    icon: ListTodo,
  },
  [EInboxIssueSource.EMAIL]: {
    label: "Mail",
    icon: Mail,
  },
};

export const InboxSourcePill = (props: TInboxSourcePill) => {
  const { source } = props;
  const { workspaceSlug } = useParams();
  const sourceDetails = sourcePillMap[source];
  return (
    <WithFeatureFlagHOC flag="INTAKE_SETTINGS" workspaceSlug={workspaceSlug?.toString()} fallback={<></>}>
      <div className="relative flex gap-1 p-1.5 py-0.5 rounded bg-custom-background-80 items-center">
        {<sourceDetails.icon className="h-3 w-3 flex-shrink-0 text-custom-text-300" />}
        <span className="text-xs text-custom-text-300 font-medium">{sourcePillMap[source].label}</span>
      </div>
    </WithFeatureFlagHOC>
  );
};
