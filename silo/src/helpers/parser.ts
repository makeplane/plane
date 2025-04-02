import { ExIssue } from "@plane/sdk";

export const closingMagicWords = [
  "close",
  "closes",
  "closed",
  "closing fix",
  "fixes",
  "fixed",
  "resolve",
  "resolves",
  "resolved",
  "resolving complete",
  "completes",
  "completing",
  "completed",
];

export const nonClosingMagicWords = ["ref", "references", "reference to", "part of", "related to"];

export interface IssueReference {
  sequence: number;
  identifier: string;
}

export interface LinkedIssues {
  closingReferences: IssueReference[];
  nonClosingReferences: IssueReference[];
}

export interface IssueWithReference {
  issue: ExIssue;
  reference: IssueReference;
}

interface ParsedIssues {
  closingRefs: string[];
  nonClosingRefs: string[];
}

export const getReferredIssues = (title: string, description: string): LinkedIssues => {
  const { closingRefs, nonClosingRefs } = parseMagicWords(description);

  const createIssueReference = (identifier: string): IssueReference | null => {
    const match = identifier.match(/([A-Z]+)-(\d+)/);
    if (match) {
      return {
        identifier: match[1],
        sequence: parseInt(match[2], 10),
      };
    }
    // This should never happen if our regex is correct, but we'll handle it just in case
    return null;
  };

  const titleRefs = createIssueReference(title) ?? [];
  const closingReferences = uniqueReferences(closingRefs.map(createIssueReference)
    .filter((ref) => ref !== null).concat(titleRefs));
  const nonClosingReferences = uniqueReferences(nonClosingRefs.map(createIssueReference)
    .filter((ref) => ref !== null)
    .filter((ref) => !closingReferences.some((closingRef) => closingRef.identifier === ref.identifier && closingRef.sequence === ref.sequence)));

  return {
    closingReferences,
    nonClosingReferences,
  };
};

export const parseIssueReference = (data: string): string[] => {
  const regex = /^([A-Z]+-\d+):/;
  const match = data.match(regex);
  return match ? [match[1]] : [];
};


export const parseMagicWords = (title: string): ParsedIssues => {
  const closingRefs: string[] = [];
  const nonClosingRefs: string[] = [];

  // Find all issue references in the title
  const allIssues = title.match(/[A-Z]+-\d+/g) || [];

  // Find all magic words in the title
  const allMagicWords = [...closingMagicWords, ...nonClosingMagicWords];
  const magicWordsRegex = new RegExp(`\\b(${allMagicWords.join("|")})\\b`, "gi");
  const magicWordMatches = [...title.matchAll(magicWordsRegex)];

  // Process magic words in reverse order
  for (let i = magicWordMatches.length - 1; i >= 0; i--) {
    const match = magicWordMatches[i];
    const word = match[1].toLowerCase();
    const startIndex = match.index! + match[0].length;

    // Find issues that appear after this magic word
    const remainingIssues = allIssues.filter((issue) => title.indexOf(issue) >= startIndex);

    if (closingMagicWords.includes(word)) {
      closingRefs.unshift(...remainingIssues);
      // Remove these issues from consideration for future iterations
      allIssues.splice(allIssues.length - remainingIssues.length, remainingIssues.length);
    } else if (nonClosingMagicWords.includes(word)) {
      nonClosingRefs.unshift(...remainingIssues);
      // Remove these issues from consideration for future iterations
      allIssues.splice(allIssues.length - remainingIssues.length, remainingIssues.length);
    }
  }

  // Any remaining issues without a preceding magic word are not considered references
  // Remove this line to prevent adding them as non-closing references
  // nonClosingRefs.unshift(...allIssues);

  return { closingRefs, nonClosingRefs };
};

// Helper function to remove duplicates while preserving order
const uniqueReferences = (refs: IssueReference[]): IssueReference[] => {
  const seen = new Set<string>();
  return refs.filter((ref) => {
    const key = `${ref.identifier}-${ref.sequence}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};
