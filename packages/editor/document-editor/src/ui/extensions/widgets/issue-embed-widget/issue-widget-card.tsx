// @ts-nocheck
import { Button } from "@plane/ui";
import { NodeViewWrapper } from "@tiptap/react";
import { Crown } from "lucide-react";

export const IssueWidgetCard = (props) => (
  <NodeViewWrapper className="issue-embed-component m-2">
    <div
      className={`${
        props.selected ? "border-custom-primary-200 border-[2px]" : ""
      } w-full h-[100px] cursor-pointer space-y-2 rounded-md border-[0.5px] border-custom-border-200 shadow-custom-shadow-2xs`}
    >
      <h5 className="h-[20%] text-xs text-custom-text-300 p-2">
        {props.node.attrs.project_identifier}-{props.node.attrs.sequence_id}
      </h5>
      <div className="relative h-[71%]">
        <div className="h-full backdrop-filter backdrop-blur-[30px] bg-custom-background-80 bg-opacity-30 flex items-center w-full justify-between gap-5 mt-2.5 pl-4 pr-5 py-3 max-md:max-w-full max-md:flex-wrap relative">
          <div className="flex gap-2 items-center">
            <div className="rounded">
              <Crown className="m-2" size={16} color="#FFBA18" />
            </div>
            <div className="text-custom-text text-sm">
              Embed and access issues in pages seamlessly, upgrade to plane pro now.
            </div>
          </div>
          <a href="https://plane.so/pricing" target="_blank" rel="noreferrer">
            <Button>Upgrade</Button>
          </a>
        </div>
      </div>
    </div>
  </NodeViewWrapper>
);
