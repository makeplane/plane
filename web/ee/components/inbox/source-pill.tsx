import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Zap, ListTodo, Mail } from "lucide-react";
import { E_FEATURE_FLAGS } from "@plane/constants/src/feature-flag";
import { EInboxIssueSource } from "@plane/constants/src/inbox";
import { TInboxSourcePill } from "@/ce/components/inbox/source-pill";
import { useFlag } from "@/plane-web/hooks/store/use-flag";

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

export const InboxSourcePill = observer((props: TInboxSourcePill) => {
  const { source } = props;
  const { workspaceSlug } = useParams();
  const isEmailEnabled = useFlag(workspaceSlug?.toString(), E_FEATURE_FLAGS.INTAKE_EMAIL);
  const isFormEnabled = useFlag(workspaceSlug?.toString(), E_FEATURE_FLAGS.INTAKE_FORM);

  const sourceDetails = sourcePillMap[source];
  if (!sourceDetails) return null;
  return isEmailEnabled || isFormEnabled ? (
    <div className="relative flex gap-1 p-1.5 py-0.5 rounded bg-custom-background-80 items-center">
      <sourceDetails.icon className="h-3 w-3 flex-shrink-0 text-custom-text-300" />
      <span className="text-xs text-custom-text-300 font-medium">{sourceDetails.label}</span>
    </div>
  ) : (
    <></>
  );
});
