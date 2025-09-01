import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { AlertTriangle } from "lucide-react";
// constants
import { ISSUE_DISPLAY_PROPERTIES } from "@plane/constants";
// types
import { EUserProjectRoles, IIssueDisplayProperties } from "@plane/types";
// ui
import { Loader } from "@plane/ui";
// components
import { IssueProperties } from "@/components/issues/issue-layouts/properties/all-properties";
// hooks
import { useUserPermissions } from "@/hooks/store";
// plane web components
import { IssueIdentifier } from "@/plane-web/components/issues";

type Props = {
  issueId: string;
  projectId: string;
  workspaceSlug: string;
};

export const IssueEmbedCard: React.FC<Props> = observer((props) =>
   null
  // const { issueId, projectId, workspaceSlug } = props;
  //
  // // states
  // const [error, setError] = useState<any | null>(null);
  //
  // // store hooks
  // const { workspaceProjectsPermissions } = useUserPermissions();
  // // const {
  // //   setPeekIssue,
  // //   issue: { fetchIssue, getIssueById, updateIssue },
  // // } = useIssueDetail();
  //
  // // derived values
  // const projectRole = workspaceProjectsPermissions?.[workspaceSlug]?.[projectId];
  // const issueDetails = getIssueById(issueId);
  //
  // // auth
  // const isReadOnly = !!projectRole && projectRole < EUserProjectRoles.MEMBER;
  //
  // // issue display properties
  // const displayProperties: IIssueDisplayProperties = {};
  //
  // ISSUE_DISPLAY_PROPERTIES.forEach((property) => {
  //   displayProperties[property.key] = true;
  // });
  //
  // // fetch issue details if not available
  // useEffect(() => {
  //   if (!issueDetails) {
  //     fetchIssue(workspaceSlug, projectId, issueId)
  //       .then(() => setError(null))
  //       .catch((error) => setError(error));
  //   }
  // }, [fetchIssue, issueDetails, issueId, projectId, workspaceSlug]);
  //
  // if (!issueDetails && !error)
  //   return (
  //     <div className="rounded-md p-3 my-2">
  //       <Loader className="px-6">
  //         <Loader.Item height="30px" />
  //         <div className="mt-3 space-y-2">
  //           <Loader.Item height="20px" width="70%" />
  //           <Loader.Item height="20px" width="60%" />
  //         </div>
  //       </Loader>
  //     </div>
  //   );
  //
  // if (error)
  //   return (
  //     <div className="flex items-center gap-3 rounded-md border-2 border-orange-500 bg-orange-500/10 text-orange-500 px-4 py-3 my-2 text-base">
  //       <AlertTriangle className="text-orange-500 size-8" />
  //       This work item embed is not found in any project. It can no longer be updated or accessed from here.
  //     </div>
  //   );
  //
  // return (
  //   <div
  //     className="issue-embed cursor-pointer space-y-2 rounded-md bg-custom-background-90 p-3 my-2"
  //     role="button"
  //     onClick={() =>
  //       setPeekIssue({
  //         issueId,
  //         projectId,
  //         workspaceSlug,
  //       })
  //     }
  //   >
  //     <IssueIdentifier
  //       issueId={issueId}
  //       projectId={projectId}
  //       textContainerClassName="text-xs font-medium text-custom-text-300"
  //     />
  //     <h4 className="!text-sm !font-medium !mt-2 line-clamp-2 break-words">{issueDetails?.name}</h4>
  //     {issueDetails && (
  //       <IssueProperties
  //         className="flex flex-wrap items-center gap-2 whitespace-nowrap text-custom-text-300 pt-1.5"
  //         issue={issueDetails}
  //         displayProperties={displayProperties}
  //         activeLayout="Page work item embed"
  //         updateIssue={async (projectId, issueId, data) => {
  //           if (projectId) {
  //             return await updateIssue(workspaceSlug, projectId, issueId, data);
  //           }
  //
  //           return;
  //         }}
  //         isReadOnly={isReadOnly}
  //       />
  //     )}
  //   </div>
  // );
);
