// plane imports
import { RANDOM_EMOJI_CODES } from "@plane/constants";
import { LUCIDE_ICONS_LIST } from "@plane/ui";

export const getRandomEmoji = () => RANDOM_EMOJI_CODES[Math.floor(Math.random() * RANDOM_EMOJI_CODES.length)];

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
  if (!Array.isArray(reactions)) {
    console.error("Expected an array of reactions, but got:", reactions);
    return {};
  }

  const groupedReactions = reactions.reduce(
    (acc: any, reaction: any) => {
      if (!reaction || typeof reaction !== "object" || !Object.prototype.hasOwnProperty.call(reaction, key)) {
        console.warn("Skipping undefined reaction or missing key:", reaction);
        return acc; // Skip undefined reactions or those without the specified key
      }

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
