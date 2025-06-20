import { useCallback, useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
// plane imports
import { TDescriptionVersionDetails, TDescriptionVersionsListResponse } from "@plane/types";
import { cn } from "@plane/utils";
// local imports
import { DescriptionVersionsDropdown } from "./dropdown";
import { DescriptionVersionsModal } from "./modal";

export type TDescriptionVersionEntityInformation = {
  createdAt: Date;
  createdByDisplayName: string;
  id: string;
  isRestoreDisabled: boolean;
};

type Props = {
  className?: string;
  entityInformation: TDescriptionVersionEntityInformation;
  fetchHandlers: {
    listDescriptionVersions: (entityId: string) => Promise<TDescriptionVersionsListResponse>;
    retrieveDescriptionVersion: (entityId: string, versionId: string) => Promise<TDescriptionVersionDetails>;
  };
  handleRestore: (descriptionHTML: string) => void;
  projectId?: string;
  workspaceSlug: string;
};

export const DescriptionVersionsRoot: React.FC<Props> = observer((props) => {
  const { className, entityInformation, fetchHandlers, handleRestore, projectId, workspaceSlug } = props;
  // states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeVersionId, setActiveVersionId] = useState<string | null>(null);
  // derived values
  const entityId = entityInformation.id;
  // fetch versions list
  const { data: versionsListResponse } = useSWR(
    entityId ? `DESCRIPTION_VERSIONS_LIST_${entityId}` : null,
    entityId ? () => fetchHandlers.listDescriptionVersions(entityId) : null
  );
  // fetch active version details
  const { data: activeVersionResponse } = useSWR(
    entityId && activeVersionId ? `DESCRIPTION_VERSION_DETAILS_${activeVersionId}` : null,
    entityId && activeVersionId ? () => fetchHandlers.retrieveDescriptionVersion(entityId, activeVersionId) : null
  );
  const versions = versionsListResponse?.results;
  const versionsCount = versions?.length ?? 0;
  const activeVersionDetails = versions?.find((version) => version.id === activeVersionId);
  const activeVersionIndex = versions?.findIndex((version) => version.id === activeVersionId);

  const handleNavigation = useCallback(
    (direction: "prev" | "next") => {
      if (activeVersionIndex === undefined) return;
      if (direction === "prev" && activeVersionIndex > 0) {
        setActiveVersionId(versions?.[activeVersionIndex - 1].id ?? null);
      } else if (direction === "next" && activeVersionIndex < versionsCount - 1) {
        setActiveVersionId(versions?.[activeVersionIndex + 1].id ?? null);
      }
    },
    [activeVersionIndex, versions, versionsCount]
  );

  return (
    <>
      <DescriptionVersionsModal
        activeVersionDescription={activeVersionResponse?.description_html ?? "<p></p>"}
        activeVersionDetails={activeVersionDetails}
        handleClose={() => {
          setIsModalOpen(false);
          setTimeout(() => {
            setActiveVersionId(null);
          }, 300);
        }}
        handleNavigation={handleNavigation}
        handleRestore={handleRestore}
        isNextDisabled={activeVersionIndex === versionsCount - 1}
        isOpen={isModalOpen}
        isPrevDisabled={activeVersionIndex === 0}
        isRestoreDisabled={entityInformation.isRestoreDisabled}
        projectId={projectId}
        workspaceSlug={workspaceSlug}
      />
      <div className={cn(className)}>
        <DescriptionVersionsDropdown
          disabled={versionsCount === 0}
          entityInformation={entityInformation}
          onVersionClick={(versionId) => {
            setIsModalOpen(true);
            setActiveVersionId(versionId);
          }}
          versions={versions}
        />
      </div>
    </>
  );
});
