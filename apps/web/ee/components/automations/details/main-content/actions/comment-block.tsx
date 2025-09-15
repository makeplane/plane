import { observer } from "mobx-react";
import { MessageCircle } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
// plane web imports
import { TAddCommentActionConfig } from "@plane/types";
import { LiteTextEditor } from "@/components/editor/lite-text/editor";

type TProps = {
  actionId: string;
  config: TAddCommentActionConfig;
  workspaceId: string;
  workspaceSlug: string;
};

export const AutomationDetailsMainContentAddCommentBlock: React.FC<TProps> = observer((props) => {
  const { actionId, config, workspaceId, workspaceSlug } = props;
  // plane hooks
  const { t } = useTranslation();

  return (
    <div className="flex gap-2">
      <span className="shrink-0 size-12 rounded-full bg-custom-background-80 grid place-items-center">
        <MessageCircle className="size-5 text-custom-text-300" />
      </span>
      <div className="flex-grow text-sm text-custom-text-300 font-medium">
        <p>{t("automations.action.comment_block.title")}</p>
        <LiteTextEditor
          editable={false}
          disabledExtensions={["enter-key"]}
          displayConfig={{
            fontSize: "small-font",
          }}
          id={actionId}
          initialValue={config.comment_text ?? "<p></p>"}
          parentClassName="p-0"
          showSubmitButton={false}
          showToolbar={false}
          workspaceId={workspaceId}
          workspaceSlug={workspaceSlug}
        />
      </div>
    </div>
  );
});
