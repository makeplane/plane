import { useState } from "react";
import { observer } from "mobx-react";
import { Link } from "lucide-react";
import { ContentWrapper, ERowVariant } from "@plane/ui";
// components
import { cn } from "@/helpers/common.helper";
import { useAppTheme } from "@/hooks/store";
// Plane-web
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
import { InitiativeLinksActionButton } from "../links/link-components/quick-action-button";
import { LinksCollapsible } from "../links/link-components/root";
import { IssueLinkCreateUpdateModal } from "../links/link-items/create-update-link-modal";
import { useLinkOperations } from "../links/link-items/links-helper";
import { ProjectsCollapsible } from "../projects/root";
import { InitiativeDescriptionInput } from "./description-input";
import { InitiativeReactions } from "./reactions";
import { InitiativeTitleInput } from "./title";

type Props = {
  workspaceSlug: string;
  initiativeId: string;
  disabled?: boolean;
};

export const InitiativeDetailSection = observer((props: Props) => {
  const { workspaceSlug, initiativeId, disabled = false } = props;

  const {
    initiative: {
      getInitiativeById,
      initiativeLinks: { isLinkModalOpen, setIsLinkModalOpen },
    },
  } = useInitiatives();
  const { initiativesSidebarCollapsed } = useAppTheme();

  const [isSubmitting, setIsSubmitting] = useState<"submitting" | "submitted" | "saved">("saved");

  const linkOperations = useLinkOperations(workspaceSlug.toString(), initiativeId);

  const initiative = getInitiativeById(initiativeId);

  if (!initiative) return <></>;

  const handleOnClose = () => {
    setIsLinkModalOpen(false);
  };

  return (
    <div
      className={cn(`h-full w-full overflow-y-auto px-9 py-5`, {
        "max-w-2/3": !initiativesSidebarCollapsed,
      })}
    >
      <ContentWrapper variant={ERowVariant.REGULAR}>
        <IssueLinkCreateUpdateModal
          isModalOpen={isLinkModalOpen}
          handleOnClose={handleOnClose}
          linkOperations={linkOperations}
        />
        <div className="rounded-lg flex flex-col w-full gap-3 space-y-4">
          <InitiativeTitleInput
            value={initiative.name}
            workspaceSlug={workspaceSlug.toString()}
            isSubmitting={isSubmitting}
            setIsSubmitting={setIsSubmitting}
            initiativeId={initiative.id}
          />
          <InitiativeDescriptionInput
            workspaceSlug={workspaceSlug.toString()}
            initiativeId={initiative.id}
            initialValue={initiative.description_html ?? undefined}
            setIsSubmitting={setIsSubmitting}
            containerClassName="min-h-[120px] w-full border-none"
          />
          <div className="flex justify-between">
            <InitiativeReactions workspaceSlug={workspaceSlug.toString()} initiativeId={initiative.id} />
            <div className="flex gap-2">
              <InitiativeLinksActionButton
                customButton={
                  <div className="flex items-center gap-1 p-2 text-custom-text-300 hover:text-custom-text-100">
                    <Link className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={2} />
                    <span className="text-sm font-medium">Add link</span>
                  </div>
                }
                disabled={disabled}
              />
            </div>
          </div>
          <LinksCollapsible workspaceSlug={workspaceSlug.toString()} initiativeId={initiative.id} />
          <ProjectsCollapsible workspaceSlug={workspaceSlug.toString()} initiativeId={initiative.id} />
        </div>
      </ContentWrapper>
    </div>
  );
});
