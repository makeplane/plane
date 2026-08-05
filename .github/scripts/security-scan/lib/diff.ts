import type { ContentItem } from "../types";

const FILE_SECTION_HEADER = /^diff --git /;
const NEW_PATH_LINE = /^\+\+\+ (?:b\/(?<path>.+)|\/dev\/null)$/;
const BINARY_MARKER = /^Binary files .* differ$/m;
const HUNK_HEADER = /^@@ .* @@/;

function splitIntoFileSections(diffText: string): string[] {
  if (diffText.trim().length === 0) {
    return [];
  }

  const lines = diffText.split("\n");
  const sections: string[][] = [];

  for (const line of lines) {
    if (FILE_SECTION_HEADER.test(line)) {
      sections.push([line]);
      continue;
    }
    sections.at(-1)?.push(line);
  }

  return sections.map((section) => section.join("\n"));
}

function extractNewPath(section: string): string | null {
  for (const line of section.split("\n")) {
    const match = NEW_PATH_LINE.exec(line);
    if (match) {
      return match.groups?.path ?? null;
    }
  }
  return null;
}

function extractHunks(section: string): string {
  const lines = section.split("\n");
  const hunkLines: string[] = [];
  let insideHunk = false;

  for (const line of lines) {
    if (HUNK_HEADER.test(line)) {
      insideHunk = true;
    }
    if (insideHunk) {
      hunkLines.push(line);
    }
  }

  return hunkLines.join("\n").trim();
}

export function parseDiff(diffText: string): ContentItem[] {
  const sections = splitIntoFileSections(diffText);
  const items: ContentItem[] = [];

  for (const section of sections) {
    if (BINARY_MARKER.test(section)) {
      continue;
    }

    const path = extractNewPath(section);
    if (path === null) {
      continue;
    }

    const content = extractHunks(section);
    if (content.length === 0) {
      continue;
    }

    items.push({ path, content });
  }

  return items;
}
