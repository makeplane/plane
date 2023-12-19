import { useState } from "react";
import { IMarking } from "src/types/editor-types";

export const useEditorMarkings = () => {
  const [markings, setMarkings] = useState<IMarking[]>([]);

  const updateMarkings = (json: any) => {
    const nodes = json.content as any[];
    const tempMarkings: IMarking[] = [];
    let h1Sequence: number = 0;
    let h2Sequence: number = 0;
    let h3Sequence: number = 0;
    if (nodes) {
      nodes.forEach((node) => {
        if (
          node.type === "heading" &&
          (node.attrs.level === 1 || node.attrs.level === 2 || node.attrs.level === 3) &&
          node.content
        ) {
          tempMarkings.push({
            type: "heading",
            level: node.attrs.level,
            text: node.content[0].text,
            sequence: node.attrs.level === 1 ? ++h1Sequence : node.attrs.level === 2 ? ++h2Sequence : ++h3Sequence,
          });
        }
      });
    }
    setMarkings(tempMarkings);
  };

  return {
    updateMarkings,
    markings,
  };
};
