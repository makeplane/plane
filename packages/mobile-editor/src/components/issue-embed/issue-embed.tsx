import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
// types
import { IIssueDisplayProperties } from "@plane/types";
// ui
import { Loader } from "@plane/ui";
// constants
import { ISSUE_DISPLAY_PROPERTIES } from "@/constants/issue";
// components
import { IssueIdentifier } from "@/components/issue-embed/issue-identifier";
import { TIssue } from "@/types/issue";
import { callNative } from "@/helpers";
import { CallbackHandlerStrings } from "@/constants/callback-handler-strings";

type Props = {
  issueId: string;
  projectId?: string;
  workspaceSlug?: string;
};

export const IssueEmbedCard: React.FC<Props> = (props) => {
  const { issueId, projectId, workspaceSlug } = props;

  // states
  const [issueDetails, setIssueDetails] = useState<TIssue | undefined>(undefined);
  const [error, setError] = useState<any | null>(null);

  // issue display properties
  const displayProperties: IIssueDisplayProperties = {};

  ISSUE_DISPLAY_PROPERTIES.forEach((property) => {
    displayProperties[property.key] = true;
  });

  // get the issue details from the native code.
  useEffect(() => {
    if (!issueDetails) {
      callNative(
        CallbackHandlerStrings.getIssueDetails,
        JSON.stringify({
          issueId,
          projectId,
          workspaceSlug,
        })
      ).then((issue: string) => setIssueDetails(JSON.parse(issue)));
    }
  }, [issueDetails, issueId, projectId, workspaceSlug]);

  if (!issueDetails && !error)
    return (
      <div className="rounded-md my-4">
        <Loader>
          <Loader.Item height="30px" />
          <div className="mt-3 space-y-2">
            <Loader.Item height="20px" width="70%" />
            <Loader.Item height="20px" width="60%" />
          </div>
        </Loader>
      </div>
    );

  if (error)
    return (
      <div className="flex items-center gap-3 rounded-md border-2 border-orange-500 bg-orange-500/10 text-orange-500 py-3 my-2 text-base">
        <AlertTriangle className="text-orange-500 size-8" />
        This Issue embed is not found in any project. It can no longer be updated or accessed from here.
      </div>
    );

  return (
    <div className="issue-embed cursor-pointer space-y-2 rounded-lg border border-custom-border-300 shadow-custom-shadow-2xs p-3 px-4 my-2">
      <IssueIdentifier
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        issueIdentifier={issueDetails?.sequenceId?.toString() ?? ""}
      />
      <h4 className="!text-lg !font-medium !mt-2 line-clamp-2 break-words">{issueDetails?.name}</h4>
      {/*issueDetails && (
        <IssueProperties
          className="flex flex-wrap items-center gap-2 whitespace-nowrap text-custom-text-300 pt-1.5"
          issue={issueDetails}
          displayProperties={displayProperties}
        />
      )} */}
    </div>
  );
};
