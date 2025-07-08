import { File } from "lucide-react";
import { useEffect, useState } from "react";
// plane imports
import { convertBytesToSize } from "@plane/utils";
// local imports
import { EAttachmentBlockAttributeNames } from "../types";
import { getAttachmentBlockId } from "../utils";
import { CustomAttachmentNodeViewProps } from "./node-view";

type Props = CustomAttachmentNodeViewProps & {
  resolvedSource: string;
};

export const CustomAttachmentBlock: React.FC<Props> = (props) => {
  const { extension, node, resolvedSource } = props;
  // states
  const [hasCheckedExistence, setHasCheckedExistence] = useState(false);
  // derived values
  const { src } = node.attrs;

  useEffect(() => {
    if (hasCheckedExistence || !src) return;
    const checkExistence = async () => {
      try {
        const doesAttachmentExist = await extension.options.checkIfAttachmentExists?.(src);
        if (!doesAttachmentExist) {
          await extension.options.restoreAttachment?.(src);
        }
      } catch (error) {
        console.error("Error in checking attachment existence", error);
      } finally {
        setHasCheckedExistence(true);
      }
    };
    checkExistence();
  }, [extension.options, hasCheckedExistence, src]);

  return (
    <a
      id={getAttachmentBlockId(node.attrs.id ?? "")}
      href={resolvedSource}
      className="py-3 px-2 rounded-lg bg-custom-background-90 hover:bg-custom-background-80 border border-custom-border-300 flex items-start gap-2 transition-colors"
      contentEditable={false}
      target="_blank"
      rel="noopener noreferrer"
    >
      <div className="flex-shrink-0 mt-1 size-8 grid place-items-center">
        <File className="flex-shrink-0 size-8 text-custom-text-300" />
      </div>
      <div className="truncate">
        <p className="not-prose text-sm truncate">{node.attrs[EAttachmentBlockAttributeNames.FILE_NAME]}</p>
        <p className="not-prose text-xs text-custom-text-300">
          {convertBytesToSize(Number(node.attrs[EAttachmentBlockAttributeNames.FILE_SIZE] || 0))}
        </p>
      </div>
    </a>
  );
};
