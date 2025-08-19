import { RichTextElement, RichTextSection, RichTextList, RichTextBlockElement, RichTextBlock } from "@slack/types";
import { ParsedIssueData, ParsedLinkWorkItemData } from "../types/types";

export const parseIssueFormData = (values: any): ParsedIssueData => {
  const parsed: ParsedIssueData = {
    title: "",
    project: "",
    description: "<p></p>",
  };

  // Loop through all blocks
  Object.entries(values).forEach(async ([_, blockData]: [string, any]) => {
    // Check for project
    if (blockData.project?.type === "static_select") {
      parsed.project = blockData.project.selected_option?.value;
    }

    // Check for title
    if (blockData.issue_title?.type === "plain_text_input") {
      parsed.title = blockData.issue_title.value;
    }

    // Check for description
    if (blockData.issue_description?.type === "rich_text_input") {
      parsed.description = richTextBlockToMrkdwn(blockData.issue_description.rich_text_value);
    }

    // Check for state
    if (blockData.issue_state?.type === "static_select") {
      parsed.state = blockData.issue_state.selected_option?.value;
    }

    // Check for priority
    if (blockData.issue_priority?.type === "static_select") {
      parsed.priority = blockData.issue_priority.selected_option?.value;
    }

    // Check for labels
    if (blockData.issue_labels?.type === "multi_static_select") {
      parsed.labels = blockData.issue_labels.selected_options?.map((option: any) => option.value);
    }

    if (blockData.enable_thread_sync?.type === "checkboxes") {
      parsed.enableThreadSync = false;
      if (blockData.enable_thread_sync.selected_options.length > 0) {
        parsed.enableThreadSync = blockData.enable_thread_sync.selected_options[0].value === "true";
      }
    }
  });

  return parsed;
};
export const quoteMrkdwn = (text: string): string => ("> " + text).split("\n").join("\n> ");

const applyMrkdwnStyle = (text: string, style: RichTextElement["style"]): string => {
  if (!style || text.startsWith(" ") || text.endsWith(" ")) return text;

  if (style.code) text = `\`${text}\``;
  if (style.strike) text = `~${text}~`;
  if (style.italic) text = `_${text}_`;
  if (style.bold) text = `*${text}*`;

  return text;
};

// Conversion from these docs: https://api.slack.com/reference/surfaces/formatting#advanced
const richTextElementToMrkdwn = (element: RichTextElement): string => {
  switch (element.type) {
    case "broadcast":
      return applyMrkdwnStyle(`!${element.range}`, element.style);
    case "channel":
      return applyMrkdwnStyle(`#${element.channel_id}`, element.style);
    case "color":
      return applyMrkdwnStyle(element.value, element.style);
    case "date":
      if (element.url) {
        return applyMrkdwnStyle(`<!date^${element.timestamp}^${element.format}|${element.url}>`, element.style);
      }
      return applyMrkdwnStyle(`<!date^${element.timestamp}^${element.format}>`, element.style);
    case "emoji":
      // emoji has unicode property, let's use that to get the emoji
      return String.fromCodePoint(parseInt(element.unicode!, 16));
    case "link":
      if (element.text) {
        return applyMrkdwnStyle(`[${element.text}](${element.url})`, element.style);
      }
      return applyMrkdwnStyle(element.url, element.style);
    case "team": // There is no documented way to display this nicely in mrkdwn
      return applyMrkdwnStyle(element.team_id, element.style);
    case "text":
      return applyMrkdwnStyle(element.text, element.style);
    case "user":
      return applyMrkdwnStyle(`@${element.user_id}`, element.style);
    case "usergroup":
      return applyMrkdwnStyle(element.usergroup_id, element.style);
    default:
      return "";
  }
};

const richTextSectionToMrkdwn = (section: RichTextSection): string =>
  section.elements.map(richTextElementToMrkdwn).join("");

const richTextListToMrkdwn = (element: RichTextList): string => {
  let mrkdwn = "";
  for (const section of element.elements) {
    mrkdwn += `${"    ".repeat(element.indent ?? 0)} • ${richTextSectionToMrkdwn(section)}\n`;
  }

  return mrkdwn;
};

const richTextBlockElementToMrkdwn = (element: RichTextBlockElement): string => {
  switch (element.type) {
    case "rich_text_list":
      return richTextListToMrkdwn(element);
    case "rich_text_preformatted":
      return "```\n" + element.elements.map(richTextElementToMrkdwn).join("") + "\n```";
    case "rich_text_quote":
      return quoteMrkdwn(element.elements.map(richTextElementToMrkdwn).join(""));
    case "rich_text_section":
      return element.elements.map(richTextElementToMrkdwn).join("");
    default:
      return "";
  }
};

export const richTextBlockToMrkdwn = (richTextBlock: RichTextBlock | undefined) => {
  if (!richTextBlock?.elements) return;

  const mrkdwn = richTextBlock.elements.map(richTextBlockElementToMrkdwn).join("");

  return mrkdwn;
};

export const parseLinkWorkItemFormData = (values: any): ParsedLinkWorkItemData | undefined => {
  let parsed: ParsedLinkWorkItemData | undefined = undefined;

  Object.entries(values).forEach(([_, blockData]: [string, any]) => {
    if (blockData.link_work_item?.type === "external_select") {
      const identifer = blockData?.link_work_item?.selected_option?.value;

      if (!identifer) {
        return;
      }

      const parts = identifer.split(":");
      if (parts.length === 3) {
        parsed = {
          workspaceSlug: parts[0],
          projectId: parts[1],
          issueId: parts[2],
        };
      }
    }
  });

  return parsed;
};

/**
 * Extracts rich text elements from Slack message blocks or parses text with links
 */
export const extractRichTextElements = (title?: string, blocks?: any[]): RichTextBlockElement[] => {
  // First, try to extract from blocks if available
  if (blocks && blocks.length > 0) {
    for (const block of blocks) {
      if (block.type === "rich_text" && block.elements && block.elements.length > 0) {
        // Return the entire rich text block elements structure
        // This preserves all formatting: lists, quotes, links, styling, etc.
        return block.elements;
      }
    }
  }

  // Fallback to parsing the raw text
  return parseSlackLinksToRichText(title ?? "") as RichTextBlockElement[];
};

/**
 * Parses Slack message text containing <url|text> links and converts them to rich text elements
 */
export const parseSlackLinksToRichText = (text: string) => {
  if (!text) return [];

  const elements: any[] = [];
  // Match both <url|text> and <url> patterns
  const linkRegex = /<([^|>]+)(?:\|([^>]+))?>/g;
  let lastIndex = 0;
  let match;

  while ((match = linkRegex.exec(text)) !== null) {
    const [fullMatch, url, linkText] = match;
    const matchStart = match.index;

    // Add any text before the link as a regular text element
    if (matchStart > lastIndex) {
      const beforeText = text.slice(lastIndex, matchStart);
      if (beforeText.trim()) {
        elements.push({
          type: "text",
          text: beforeText,
        });
      }
    }

    // Add the link element
    elements.push({
      type: "link",
      text: linkText || url, // Use linkText if provided, otherwise use URL as text
      url: url,
    });

    lastIndex = matchStart + fullMatch.length;
  }

  // Add any remaining text after the last link
  if (lastIndex < text.length) {
    const remainingText = text.slice(lastIndex);
    if (remainingText.trim()) {
      elements.push({
        type: "text",
        text: remainingText,
      });
    }
  }

  // If no links were found, return the original text as a single text element
  if (elements.length === 0 && text.trim()) {
    elements.push({
      type: "text",
      text: text,
    });
  }

  return [
    {
      type: "rich_text_section",
      elements: elements,
    },
  ];
};
