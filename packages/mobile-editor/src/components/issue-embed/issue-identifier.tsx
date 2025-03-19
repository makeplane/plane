import { Loader } from "@plane/ui";
import React, { useEffect, useState } from "react";
import { callNative } from "@/helpers/flutter-callback.helper";
import { CallbackHandlerStrings } from "@/constants/callback-handler-strings";

type Props = {
  issueIdentifier: string;
  projectId?: string;
  workspaceSlug?: string;
};

export const IssueIdentifier: React.FC<Props> = (props) => {
  const { projectId, workspaceSlug, issueIdentifier } = props;
  const [projectIdentifier, setProjectIdentifier] = useState<String | undefined>(undefined);

  // get the project identifier from the native code.
  useEffect(() => {
    if (!projectIdentifier) {
      callNative(
        CallbackHandlerStrings.getProjectIdentifier,
        JSON.stringify({
          projectId,
          workspaceSlug,
        })
      ).then((identifier: string) => setProjectIdentifier(identifier));
    }
  }, [projectId, workspaceSlug]);

  if (!projectIdentifier)
    return (
      <Loader className="flex flex-shrink-0 w-20 h-5">
        <Loader.Item height="100%" width="100%" />
      </Loader>
    );

  return (
    <span className={"text-sm font-medium text-custom-text-300"}>{`${projectIdentifier}-${issueIdentifier}`}</span>
  );
};
