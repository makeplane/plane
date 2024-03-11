import { FC, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@plane/ui";
// components
import { CreateUpdateProjectViewModal } from "components/views";

interface ISaveFilterView {
  workspaceSlug: string;
  projectId: string;
  filterParams: any;
}

export const SaveFilterView: FC<ISaveFilterView> = (props) => {
  const { workspaceSlug, projectId, filterParams } = props;

  const [viewModal, setViewModal] = useState<boolean>(false);

  return (
    <div>
      <CreateUpdateProjectViewModal
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        preLoadedData={{ filters: { ...filterParams } }}
        isOpen={viewModal}
        onClose={() => setViewModal(false)}
      />

      <Button size="sm" prependIcon={<Plus />} onClick={() => setViewModal(true)}>
        Save View
      </Button>
    </div>
  );
};
