// @ts-nocheck

import React, { useState, useEffect } from "react";
import { NodeViewWrapper, NodeViewContent } from "@tiptap/react";
import { Avatar, AvatarGroup, Loader, PriorityIcon } from "@plane/ui";
import { Calendar } from "lucide-react";

export default (props) => {
  const [loading, setLoading] = useState<number>(1);
  const [issueDetails, setIssueDetails] = useState();

  useEffect(() => {
    props.issueEmbedConfig
      .fetchIssue(props.node.attrs.entity_identifier)
      .then((issue) => {
        setIssueDetails(issue);
        setLoading(0);
      })
      .catch((error) => {
        console.log(error);
        setLoading(-1);
      });
  }, []);

  const completeIssueEmbedAction = () => {
    props.issueEmbedConfig.clickAction(issueDetails.id, props.node.attrs.title);
  };

  return (
    <NodeViewWrapper className="issue-embed-component m-2">
      {loading == 0 ? (
        <div
          onClick={completeIssueEmbedAction}
          className="cursor-pointer w-full space-y-2 border-[0.5px] border-custom-border-200 rounded-md p-3 shadow-custom-shadow-2xs"
        >
          <h5 className="text-xs text-custom-text-300">
            {issueDetails.project_detail.identifier}-{issueDetails.sequence_id}
          </h5>
          <h4 className="break-words text-sm font-medium">
            {props.node.attrs.title}
          </h4>
          <div className="flex items-center flex-wrap gap-x-3 gap-y-2">
            <div>
              <PriorityIcon priority={issueDetails.priority} />
            </div>
            <div>
              <AvatarGroup size="sm">
                {issueDetails.assignee_details.map((assignee) => (
                  <Avatar
                    key={assignee.id}
                    name={assignee.display_name}
                    src={assignee.avatar}
                  />
                ))}
              </AvatarGroup>
            </div>
            <div className="rounded flex px-2.5 py-1 items-center border-[0.5px] border-custom-border-300 gap-1 text-custom-text-100 text-xs h-5">
              <Calendar className="h-3 w-3" strokeWidth={1.5} />
              {new Date(issueDetails.target_date).toLocaleString()}
            </div>
          </div>
        </div>
      ) : loading == -1 ? (
        <div className="w-full space-y-2 border-[0.5px] border-custom-border-200 rounded-md p-3 shadow-custom-shadow-2xs">
          {"Error Occured"}
        </div>
      ) : (
        <div className="w-full space-y-2 border-[0.5px] border-custom-border-200 rounded-md p-3 shadow-custom-shadow-2xs">
          <Loader className={"px-6"}>
            <Loader.Item height={"30px"} />
            <div className={"space-y-2 mt-3"}>
              <Loader.Item height={"20px"} width={"70%"} />
              <Loader.Item height={"20px"} width={"60%"} />
            </div>
          </Loader>
        </div>
      )}
    </NodeViewWrapper>
  );
};
