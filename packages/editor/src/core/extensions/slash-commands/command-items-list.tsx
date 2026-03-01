/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import type { Editor } from "@tiptap/core";
import {
  ALargeSmall,
  CaseSensitive,
  Code2,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  ImageIcon,
  ListOrdered,
  ListTodo,
  MessageSquareText,
  MinusSquare,
  Smile,
  Table,
  TextQuote,
} from "lucide-react";
import { ListLayoutIcon } from "@plane/propel/icons";
// constants
import { COLORS_LIST } from "@/constants/common";
// helpers
import {
  insertTableCommand,
  toggleBlockquote,
  toggleBulletList,
  toggleOrderedList,
  toggleTaskList,
  toggleHeading,
  toggleTextColor,
  toggleBackgroundColor,
  insertImage,
  insertCallout,
  setText,
  openEmojiPicker,
} from "@/helpers/editor-commands";
// plane editor extensions
import { coreEditorAdditionalSlashCommandOptions } from "@/plane-editor/extensions";
// types
import type { CommandProps, ISlashCommandItem, TSlashCommandSectionKeys } from "@/types";
// local types
import type { TExtensionProps, TSlashCommandAdditionalOption } from "./root";

export type TSlashCommandSection = {
  key: TSlashCommandSectionKeys;
  title?: string;
  items: ISlashCommandItem[];
};

// Fuzzy search utility: prefix-first matching, strict for short queries, relaxed for longer ones
const normalize = (s: string): string => s.toLowerCase().trim();

const tokenize = (s: string): string[] =>
  normalize(s)
    .split(/[\s\-_/]+/)
    .filter(Boolean);

const getInitialism = (tokens: string[]): string => tokens.map((t) => (/^\d+$/.test(t) ? t : t[0])).join("");

/**
 * Match compressed multi-word intent (e.g. "blist" => "Bulleted list" via "b" + "list").
 */
const getCompressedWordPrefixScore = (queryToken: string, textTokens: string[]): number => {
  if (queryToken.length < 2 || textTokens.length < 2) return 0;

  let bestScore = 0;

  for (let splitIdx = 1; splitIdx < queryToken.length; splitIdx++) {
    const leftPart = queryToken.slice(0, splitIdx);
    const rightPart = queryToken.slice(splitIdx);

    for (let leftIdx = 0; leftIdx < textTokens.length - 1; leftIdx++) {
      const leftToken = textTokens[leftIdx];
      if (!leftToken.startsWith(leftPart)) continue;

      for (let rightIdx = leftIdx + 1; rightIdx < textTokens.length; rightIdx++) {
        const rightToken = textTokens[rightIdx];
        if (!rightToken.startsWith(rightPart)) continue;

        const indexPenalty = leftIdx * 6 + (rightIdx - leftIdx - 1) * 10;
        const lengthPenalty = (leftToken.length - leftPart.length) * 0.4 + (rightToken.length - rightPart.length) * 0.6;

        const score = 930 - indexPenalty - lengthPenalty;
        if (score > bestScore) {
          bestScore = score;
        }
      }
    }
  }

  return bestScore;
};

/**
 * Bounded Levenshtein distance — returns early when distance exceeds maxDist.
 */
const levenshteinBounded = (a: string, b: string, maxDist: number): number => {
  if (Math.abs(a.length - b.length) > maxDist) return maxDist + 1;
  const dp = new Array<number>(b.length + 1);
  for (let j = 0; j <= b.length; j++) dp[j] = j;

  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0];
    dp[0] = i;
    let rowMin = dp[0];
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + cost);
      prev = tmp;
      rowMin = Math.min(rowMin, dp[j]);
    }
    if (rowMin > maxDist) return maxDist + 1;
  }
  return dp[b.length];
};

/**
 * Score a single query token against a text string.
 * Short queries (≤3 chars) only match via prefix; longer queries allow substring + typo tolerance.
 */
const matchToken = (queryToken: string, text: string): number => {
  const tNorm = normalize(text);
  const tTokens = tokenize(text);
  const tNoSpace = tTokens.join("");

  // 1. Exact token match
  if (tTokens.includes(queryToken)) return 1000;

  // 2. Phrase starts with query
  if (tNorm.startsWith(queryToken)) return 950;

  // 3. Token prefix — a word in the text starts with the query
  for (let i = 0; i < tTokens.length; i++) {
    if (tTokens[i].startsWith(queryToken)) {
      return 900 - i * 5 - (tTokens[i].length - queryToken.length) * 0.5;
    }
  }

  // 4. No-space phrase prefix (e.g. "bu" matches "bulletedlist")
  if (tNoSpace.startsWith(queryToken)) return 880;

  // 5. Initialism prefix (e.g. "h1" matches "Heading 1")
  const init = getInitialism(tTokens);
  if (init.startsWith(queryToken)) return 700 - (init.length - queryToken.length) * 2;

  // 6. Compressed multi-word prefix (e.g. "blist" => "Bulleted list")
  const compressedWordPrefixScore = getCompressedWordPrefixScore(queryToken, tTokens);
  if (compressedWordPrefixScore > 0) return compressedWordPrefixScore;

  // For short queries (≤3 chars), stop here to avoid false positives
  if (queryToken.length <= 3) return 0;

  // 7. Substring match (only for longer queries)
  const substringIdx = tNorm.indexOf(queryToken);
  if (substringIdx >= 0) {
    return 650 - substringIdx * 5;
  }

  // 8. Subsequence match with span constraint (e.g. "hed5" → "heading5")
  {
    let qi = 0;
    let firstIdx = -1;
    let lastIdx = -1;
    for (let ti = 0; ti < tNoSpace.length && qi < queryToken.length; ti++) {
      if (tNoSpace[ti] === queryToken[qi]) {
        if (firstIdx === -1) firstIdx = ti;
        lastIdx = ti;
        qi++;
      }
    }
    const span = lastIdx - firstIdx + 1;
    if (qi === queryToken.length && span <= queryToken.length * 3) {
      return 600 - (span - queryToken.length) * 2;
    }
  }

  // 9. Typo tolerance (only for longer queries, same starting letter)
  const maxDist = queryToken.length >= 7 ? 2 : 1;
  for (let i = 0; i < tTokens.length; i++) {
    const tt = tTokens[i];
    if (tt[0] !== queryToken[0]) continue;
    if (levenshteinBounded(queryToken, tt, maxDist) <= maxDist) {
      return 600 - i * 5;
    }
  }

  return 0;
};

// Split a token at letter↔digit boundaries (e.g. "he5" → ["he","5"], "h1" → ["h","1"])
const splitAlphaDigit = (token: string): string[] => token.match(/[a-z]+|\d+/g)?.filter(Boolean) ?? [];

const fuzzySearch = (query: string, text: string): { match: boolean; score: number } => {
  const q = normalize(query);
  if (!q) return { match: true, score: 0 };
  if (!text) return { match: false, score: 0 };

  const qTokens = q.split(/\s+/).flatMap(splitAlphaDigit).filter(Boolean);

  // Single-token query
  if (qTokens.length === 1) {
    const score = matchToken(qTokens[0], text);
    return { match: score > 0, score };
  }

  // Multi-token query: every query token must match
  let total = 0;
  for (const qt of qTokens) {
    const s = matchToken(qt, text);
    if (s <= 0) return { match: false, score: 0 };
    total += s;
  }

  // Bonus if the full query appears as a contiguous substring
  if (normalize(text).includes(q)) total += 50;

  return { match: true, score: total };
};

export const getSlashCommandFilteredSections =
  (args: TExtensionProps) =>
  ({ query, editor }: { query: string; editor: Editor }): TSlashCommandSection[] => {
    const { additionalOptions: externalAdditionalOptions, disabledExtensions, flaggedExtensions } = args;
    const SLASH_COMMAND_SECTIONS: TSlashCommandSection[] = [
      {
        key: "general",
        items: [
          {
            commandKey: "text",
            key: "text",
            title: "Text",
            description: "Just start typing with plain text.",
            searchTerms: ["p", "paragraph"],
            icon: <CaseSensitive className="size-3.5" />,
            command: ({ editor, range }) => setText(editor, range),
          },
          {
            commandKey: "h1",
            key: "h1",
            title: "Heading 1",
            description: "Big section heading.",
            searchTerms: ["title", "big", "large"],
            icon: <Heading1 className="size-3.5" />,
            command: ({ editor, range }) => toggleHeading(editor, 1, range),
          },
          {
            commandKey: "h2",
            key: "h2",
            title: "Heading 2",
            description: "Medium section heading.",
            searchTerms: ["subtitle", "medium"],
            icon: <Heading2 className="size-3.5" />,
            command: ({ editor, range }) => toggleHeading(editor, 2, range),
          },
          {
            commandKey: "h3",
            key: "h3",
            title: "Heading 3",
            description: "Small section heading.",
            searchTerms: ["subtitle", "small"],
            icon: <Heading3 className="size-3.5" />,
            command: ({ editor, range }) => toggleHeading(editor, 3, range),
          },
          {
            commandKey: "h4",
            key: "h4",
            title: "Heading 4",
            description: "Small section heading.",
            searchTerms: ["subtitle", "small"],
            icon: <Heading4 className="size-3.5" />,
            command: ({ editor, range }) => toggleHeading(editor, 4, range),
          },
          {
            commandKey: "h5",
            key: "h5",
            title: "Heading 5",
            description: "Small section heading.",
            searchTerms: ["subtitle", "small"],
            icon: <Heading5 className="size-3.5" />,
            command: ({ editor, range }) => toggleHeading(editor, 5, range),
          },
          {
            commandKey: "h6",
            key: "h6",
            title: "Heading 6",
            description: "Small section heading.",
            searchTerms: ["subtitle", "small"],
            icon: <Heading6 className="size-3.5" />,
            command: ({ editor, range }) => toggleHeading(editor, 6, range),
          },

          {
            commandKey: "numbered-list",
            key: "numbered-list",
            title: "Numbered list",
            description: "Create a numbered list.",
            searchTerms: ["ordered"],
            icon: <ListOrdered className="size-3.5" />,
            command: ({ editor, range }) => toggleOrderedList(editor, range),
          },
          {
            commandKey: "bulleted-list",
            key: "bulleted-list",
            title: "Bulleted list",
            description: "Create a bulleted list.",
            searchTerms: ["unordered", "point"],
            icon: <ListLayoutIcon className="size-3.5" />,
            command: ({ editor, range }) => toggleBulletList(editor, range),
          },
          {
            commandKey: "to-do-list",
            key: "to-do-list",
            title: "To-do list",
            description: "Create a to-do list.",
            searchTerms: ["todo", "task", "list", "check", "checkbox"],
            icon: <ListTodo className="size-3.5" />,
            command: ({ editor, range }) => toggleTaskList(editor, range),
          },
          {
            commandKey: "table",
            key: "table",
            title: "Table",
            description: "Create a table",
            searchTerms: ["table", "cell", "db", "data", "tabular"],
            icon: <Table className="size-3.5" />,
            command: ({ editor, range }) => insertTableCommand(editor, range),
          },
          {
            commandKey: "quote",
            key: "quote",
            title: "Quote",
            description: "Capture a quote.",
            searchTerms: ["blockquote"],
            icon: <TextQuote className="size-3.5" />,
            command: ({ editor, range }) => toggleBlockquote(editor, range),
          },
          {
            commandKey: "code",
            key: "code",
            title: "Code",
            description: "Capture a code snippet.",
            searchTerms: ["codeblock"],
            icon: <Code2 className="size-3.5" />,
            command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleCodeBlock().run(),
          },
          {
            commandKey: "callout",
            key: "callout",
            title: "Callout",
            icon: <MessageSquareText className="size-3.5" />,
            description: "Insert callout",
            searchTerms: ["callout", "comment", "message", "info", "alert"],
            command: ({ editor, range }: CommandProps) => insertCallout(editor, range),
          },

          {
            commandKey: "divider",
            key: "divider",
            title: "Divider",
            description: "Visually divide blocks.",
            searchTerms: ["line", "divider", "horizontal", "rule", "separate"],
            icon: <MinusSquare className="size-3.5" />,
            command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setHorizontalRule().run(),
          },
          {
            commandKey: "emoji",
            key: "emoji",
            title: "Emoji",
            description: "Insert an emoji",
            searchTerms: ["emoji", "icons", "reaction", "emoticon", "emotags"],
            icon: <Smile className="size-3.5" />,
            command: ({ editor, range }) => {
              openEmojiPicker(editor, range);
            },
          },
        ],
      },
      {
        key: "text-colors",
        title: "Colors",
        items: [
          {
            commandKey: "text-color",
            key: "text-color-default",
            title: "Default",
            description: "Change text color",
            searchTerms: ["color", "text", "default"],
            icon: <ALargeSmall className="size-3.5 text-primary" />,
            command: ({ editor, range }) => toggleTextColor(undefined, editor, range),
          },
          ...COLORS_LIST.map(
            (color) =>
              ({
                commandKey: "text-color",
                key: `text-color-${color.key}`,
                title: color.label,
                description: "Change text color",
                searchTerms: ["color", "text", color.label],

                icon: (
                  <ALargeSmall
                    className="size-3.5"
                    style={{
                      color: color.textColor,
                    }}
                  />
                ),

                command: ({ editor, range }) => toggleTextColor(color.key, editor, range),
              }) as ISlashCommandItem
          ),
        ],
      },
      {
        key: "background-colors",
        title: "Background colors",
        items: [
          {
            commandKey: "background-color",
            key: "background-color-default",
            title: "Default background",
            description: "Change background color",
            searchTerms: ["color", "bg", "background", "default"],
            icon: <ALargeSmall className="size-3.5" />,
            iconContainerStyle: {
              borderRadius: "4px",
              backgroundColor: "var(--background-color-surface-1)",
              border: "1px solid var(--border-color-strong)",
            },
            command: ({ editor, range }) => toggleTextColor(undefined, editor, range),
          },
          ...COLORS_LIST.map(
            (color) =>
              ({
                commandKey: "background-color",
                key: `background-color-${color.key}`,
                title: color.label,
                description: "Change background color",
                searchTerms: ["color", "bg", "background", color.label],
                icon: <ALargeSmall className="size-3.5" />,

                iconContainerStyle: {
                  borderRadius: "4px",
                  backgroundColor: color.backgroundColor,
                },

                command: ({ editor, range }) => toggleBackgroundColor(color.key, editor, range),
              }) as ISlashCommandItem
          ),
        ],
      },
    ];

    const internalAdditionalOptions: TSlashCommandAdditionalOption[] = [];
    if (!disabledExtensions?.includes("image")) {
      internalAdditionalOptions.push({
        commandKey: "image",
        key: "image",
        title: "Image",
        icon: <ImageIcon className="size-3.5" />,
        description: "Insert an image",
        searchTerms: ["img", "photo", "picture", "media", "upload"],
        command: ({ editor, range }: CommandProps) => insertImage({ editor, event: "insert", range }),
        section: "general",
        pushAfter: "code",
      });
    }

    [
      ...internalAdditionalOptions,
      ...(externalAdditionalOptions ?? []),
      ...coreEditorAdditionalSlashCommandOptions({
        disabledExtensions,
        flaggedExtensions,
        editor,
      }),
    ]?.forEach((item) => {
      const sectionToPushTo = SLASH_COMMAND_SECTIONS.find((s) => s.key === item.section) ?? SLASH_COMMAND_SECTIONS[0];
      const itemIndexToPushAfter = sectionToPushTo.items.findIndex(
        (i) => i.commandKey === item.pushAfter || i.key === item.pushAfter
      );
      if (itemIndexToPushAfter !== -1) {
        sectionToPushTo.items.splice(itemIndexToPushAfter + 1, 0, item);
      } else {
        sectionToPushTo.items.push(item);
      }
    });

    const filteredSlashSections = SLASH_COMMAND_SECTIONS.map((section) => {
      // Get items with fuzzy search scores
      const scoredItems = section.items
        // Filter out items that should not be shown based on editor state
        .filter((item) => !item.shouldShow || item.shouldShow(editor))
        .map((item) => {
          if (!query) return { item, score: 0, match: true };

          const titleMatch = fuzzySearch(query, item.title);

          // Only match against description for longer queries to avoid noise
          const descMatch = query.length > 3 ? fuzzySearch(query, item.description) : { match: false, score: 0 };

          // Check search terms
          let termScore = 0;
          let termMatch = false;
          for (const term of item.searchTerms) {
            const result = fuzzySearch(query, term);
            if (result.match) {
              termMatch = true;
              termScore = Math.max(termScore, result.score);
            }
          }

          // Use the best match from title, description or search terms
          const match = titleMatch.match || descMatch.match || termMatch;
          const score = Math.max(
            titleMatch.score * 2, // Title matches are most important
            descMatch.score,
            termScore * 1.5 // Search term matches are also important
          );

          return { item, score, match };
        })
        .filter(({ match }) => match)
        .sort((a, b) => b.score - a.score); // Sort by score, highest first

      return {
        ...section,
        items: scoredItems.map(({ item }) => item),
      };
    });

    return filteredSlashSections.filter((s) => s.items.length !== 0);
  };
