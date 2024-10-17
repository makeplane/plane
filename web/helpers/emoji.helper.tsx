// ui
import { LUCIDE_ICONS_LIST } from "@plane/ui";

export const getRandomEmoji = () => {
  const emojis = [
    "8986",
    "9200",
    "128204",
    "127773",
    "127891",
    "127947",
    "128076",
    "128077",
    "128187",
    "128188",
    "128512",
    "128522",
    "128578",
  ];

  return emojis[Math.floor(Math.random() * emojis.length)];
};

export const getRandomIconName = () => LUCIDE_ICONS_LIST[Math.floor(Math.random() * LUCIDE_ICONS_LIST.length)].name;

export const renderEmoji = (
  emoji:
    | string
    | {
        name: string;
        color: string;
      }
) => {
  if (!emoji) return;

  if (typeof emoji === "object")
    return (
      <span style={{ fontSize: "16px", color: emoji.color }} className="material-symbols-rounded">
        {emoji.name}
      </span>
    );
  else return isNaN(parseInt(emoji)) ? emoji : String.fromCodePoint(parseInt(emoji));
};

export const groupReactions: (reactions: any[], key: string) => { [key: string]: any[] } = (
  reactions: any,
  key: string
) => {
  const groupedReactions = reactions.reduce(
    (acc: any, reaction: any) => {
      if (!acc[reaction[key]]) {
        acc[reaction[key]] = [];
      }
      acc[reaction[key]].push(reaction);
      return acc;
    },
    {} as { [key: string]: any[] }
  );

  return groupedReactions;
};

export const convertHexEmojiToDecimal = (emojiUnified: string): string => {
  if (!emojiUnified) return "";

  return emojiUnified
    .toString()
    .split("-")
    .map((e) => parseInt(e, 16))
    .join("-");
};

export const emojiCodeToUnicode = (emoji: string) => {
  if (!emoji) return "";

  // convert emoji code to unicode
  const uniCodeEmoji = emoji
    .toString()
    .split("-")
    .map((emoji) => parseInt(emoji, 10).toString(16))
    .join("-");

  return uniCodeEmoji;
};
