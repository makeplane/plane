"use client";

import { FC, useState } from "react";
import { IIssueDisplayFilterOptions, IIssueDisplayProperties, IIssueFilterOptions } from "@plane/types";
import { Button } from "@plane/ui";
// components
import { CreateUpdateProjectViewModal } from "@/components/views";

interface ISaveFilterView {
  workspaceSlug: string;
  projectId: string;
  filterParams: {
    filters: IIssueFilterOptions;
    display_filters?: IIssueDisplayFilterOptions;
    display_properties?: IIssueDisplayProperties;
  };
}

export const SaveFilterView: FC<ISaveFilterView> = (props) => {
  const { workspaceSlug, projectId, filterParams } = props;

  const [viewModal, setViewModal] = useState<boolean>(false);

  return (
    <div>
      <CreateUpdateProjectViewModal
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        preLoadedData={{ ...filterParams }}
        isOpen={viewModal}
        onClose={() => setViewModal(false)}
      />

      <Button size="sm" onClick={() => setViewModal(true)}>
        Save View
      </Button>
    </div>
  );
};
