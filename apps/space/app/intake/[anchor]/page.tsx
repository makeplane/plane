"use client";

import { observer } from "mobx-react";
// hooks
import { usePublish } from "@/hooks/store/publish";
import CreateIssueModal from "@/plane-web/components/intake/create/create-issue-modal";

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

  return <CreateIssueModal project={publishSettings.project_details} anchor={anchor} />;
});

export default IssuesPage;
