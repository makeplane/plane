import { useCallback, useState } from "react";

export interface IMarking {
  type: "heading";
  level: number;
  text: string;
  sequence: number;
}

export const useEditorMarkings = () => {
  const [markings, setMarkings] = useState<IMarking[]>([]);

  const updateMarkings = useCallback((html: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const headings = doc.querySelectorAll("h1, h2, h3");
    const tempMarkings: IMarking[] = [];
    let h1Sequence: number = 0;
    let h2Sequence: number = 0;
    let h3Sequence: number = 0;

    headings.forEach((heading) => {
      const level = parseInt(heading.tagName[1]); // Extract the number from h1, h2, h3
      tempMarkings.push({
        type: "heading",
        level: level,
        text: heading.textContent || "",
        sequence: level === 1 ? ++h1Sequence : level === 2 ? ++h2Sequence : ++h3Sequence,
      });
    });

    setMarkings(tempMarkings);
  }, []);

  return {
    updateMarkings,
    markings,
  };
};
