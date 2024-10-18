"use client";

import { observer } from "mobx-react";
// hooks
import CreateIssueModal from "@/components/intake/create/create-issue-modal";
import { usePublish } from "@/hooks/store";

type Props = {
  params: {
    anchor: string;
  };
};

const IssuesPage = observer((props: Props) => {
  const { params } = props;
  const { anchor } = params;
  // params

  const publishSettings = usePublish(anchor);

  if (!publishSettings?.project_details) return null;

  return <CreateIssueModal project={publishSettings.project_details} />;
});

export default IssuesPage;
